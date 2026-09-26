import { useState } from "react";
import { createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { auth, db, getSecondaryAuth } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ALL_STATUSES, ORDER_STAGES, stageIndex, isExtraStatus, statusLabel } from "../utils/orderStages";
import { SHIPPING_CHARGE, parseAmount, formatAED } from "../utils/Pricing";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [pendingChildren, setPendingChildren] = useState([]);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetches everything once. Called on mount and whenever admin
  // presses "Refresh" or does an action that changes the data.
  const loadAll = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const childrenSnap = await getDocs(
        query(collection(db, "users"), where("createdBy", "==", user.uid))
      );
      setChildren(childrenSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const pendingSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "child"), where("status", "==", "pending"))
      );
      setPendingChildren(pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const ordersSnap = await getDocs(
        query(collection(db, "orders"), where("createdBy", "==", user.uid), orderBy("orderedAt", "desc"))
      );
      setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } finally {
      setRefreshing(false);
    }
  };

  useState(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateChild = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    const secondaryAuth = getSecondaryAuth();
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role: "child",
        status: "approved",
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      await secondarySignOut(secondaryAuth);
      setMsg(`Child account created for ${email}`);
      setName("");
      setEmail("");
      setPassword("");
      await loadAll();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (childDoc) => {
    await updateDoc(doc(db, "users", childDoc.id), {
      status: "approved",
      createdBy: user.uid,
    });
    await loadAll();
  };

  const handleReject = async (childDoc) => {
    await updateDoc(doc(db, "users", childDoc.id), {
      status: "rejected",
    });
    await loadAll();
  };

  // Deletes the user's Firestore profile. Note: this does NOT delete
  // their Firebase Authentication login (that needs a server-side
  // Admin SDK) — it just removes their data/access from the app.
  const handleDeleteChild = async (childDoc) => {
    const ok = window.confirm(`Delete ${childDoc.name} (${childDoc.email})? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "users", childDoc.id));
      await loadAll();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const [selectedChild, setSelectedChild] = useState("");
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [price, setPrice] = useState("");
  const [orderMsg, setOrderMsg] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setOrderError("");
    setOrderMsg("");
    if (!selectedChild) {
      setOrderError("Select a child first");
      return;
    }
    setOrderLoading(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, "orders"), {
        childId: selectedChild,
        productName,
        productDetails,
        price,
        status: "ordered",
        orderedAt: now,
        confirmedAt: null,
        shippedAt: null,
        outForDeliveryAt: null,
        deliveredAt: null,
        noAnswerAt: null,
        cancelledAt: null,
        shippingCharges: SHIPPING_CHARGE,
        createdBy: user.uid,
      });
      setOrderMsg("Order created");
      setProductName("");
      setProductDetails("");
      setPrice("");
      await loadAll();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    const now = new Date().toISOString();
    const updates = { status: newStatus };

    if (isExtraStatus(newStatus)) {
      const stage = ALL_STATUSES.find((s) => s.key === newStatus);
      updates[stage.dateField] = now;
    } else {
      const targetIdx = stageIndex(newStatus);
      if (targetIdx === -1) return;
      ORDER_STAGES.forEach((stage, idx) => {
        if (idx <= targetIdx && !order[stage.dateField]) {
          updates[stage.dateField] = now;
        }
      });
    }

    await updateDoc(doc(db, "orders", order.id), updates);
    await loadAll();
  };

  // Deletes an order document from Firestore.
  const handleDeleteOrder = async (order) => {
    const ok = window.confirm(`Delete order "${order.productName}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "orders", order.id));
      await loadAll();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const childName = (childId) => children.find((c) => c.id === childId)?.name || "Unknown";

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-create-link">
          <span>Need an admin account?</span>
          <Link to="/signup">Create one →</Link>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="refresh-btn" onClick={loadAll} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <form className="auth-card" onSubmit={handleCreateChild}>
          <h3>Create Child Account</h3>
          {error && <p className="error">{error}</p>}
          {msg && <p className="success">{msg}</p>}
          <input type="text" placeholder="Child's Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Child's Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Set Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        </form>

        <div className="child-list">
          <h3>Child Accounts ({children.length})</h3>
          {children.length === 0 && <p>No child accounts yet.</p>}
          <ul className="order-list">
            {children.map((c) => (
              <li key={c.id} className="order-item">
                <div className="order-item-header">
                  <strong>{c.name}</strong>
                </div>
                <p className="order-meta">{c.email}</p>
                <button className="reject-btn" onClick={() => handleDeleteChild(c)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {pendingChildren.length > 0 && (
        <div className="child-list" style={{ marginTop: 24 }}>
          <h3>Pending Requests ({pendingChildren.length})</h3>
          <ul className="order-list">
            {pendingChildren.map((c) => (
              <li key={c.id} className="order-item">
                <div className="order-item-header">
                  <strong>{c.name}</strong>
                </div>
                <p className="order-meta">{c.email}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="approve-btn" onClick={() => handleApprove(c)}>Approve</button>
                  <button className="reject-btn" onClick={() => handleReject(c)}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <form className="auth-card" onSubmit={handleCreateOrder}>
          <h3>Add Order</h3>
          {orderError && <p className="error">{orderError}</p>}
          {orderMsg && <p className="success">{orderMsg}</p>}
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} required>
            <option value="">Select child...</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
          <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
          <textarea placeholder="Product Details" value={productDetails} onChange={(e) => setProductDetails(e.target.value)} rows={3} />
          <input type="text" placeholder="Price (e.g. Rs. 2500)" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <p className="shipping-note">
            + Shipping Charges: {formatAED(SHIPPING_CHARGE)} (added automatically to every order)
          </p>
          <button type="submit" disabled={orderLoading}>{orderLoading ? "Creating..." : "Create Order"}</button>
        </form>

        <div className="child-list">
          <h3>All Orders ({orders.length})</h3>
          {orders.length === 0 && <p>No orders yet.</p>}
          <ul className="order-list">
            {orders.map((o) => (
              <li key={o.id} className="order-item">
                <div className="order-item-header">
                  <strong>{o.productName}</strong>
                  <span className={`status-badge status-${o.status}`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
                <p className="order-meta">For: {childName(o.childId)} · {o.price}</p>
                <p className="order-meta shipping-line">
                  + Shipping: {formatAED(o.shippingCharges ?? SHIPPING_CHARGE)} · Total:{" "}
                  {formatAED(parseAmount(o.price) + parseAmount(o.shippingCharges ?? SHIPPING_CHARGE))}
                </p>
                <div className="order-item-actions">
                  <select
                    className="status-select"
                    value={o.status}
                    onChange={(e) => handleStatusChange(o, e.target.value)}
                  >
                    <optgroup label="Progress">
                      {ORDER_STAGES.map((stage) => (
                        <option key={stage.key} value={stage.key}>{stage.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Exceptions">
                      <option value="no_answer">No Answer</option>
                      <option value="cancelled">Cancelled</option>
                    </optgroup>
                  </select>
                  <button
                    type="button"
                    className="invoice-btn"
                    onClick={() => navigate(`/invoice/${o.id}`)}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    className="reject-btn"
                    onClick={() => handleDeleteOrder(o)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}