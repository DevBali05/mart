import { useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ORDER_STAGES, stageIndex, isExtraStatus, statusLabel, formatDate } from "../utils/orderStages";

export default function ChildDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const snap = await getDocs(
        query(collection(db, "orders"), where("childId", "==", user.uid), orderBy("orderedAt", "desc"))
      );
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } finally {
      setRefreshing(false);
    }
  };

  useState(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/child-login");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>My Orders</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="refresh-btn" onClick={loadOrders} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {orders.length === 0 && <p>No orders yet.</p>}

      <div className="orders-column">
        {orders.map((o) => {
          const currentIdx = stageIndex(o.status);
          const exception = isExtraStatus(o.status);
          return (
            <div key={o.id} className="order-card">
              <div className="order-card-header">
                <h3>{o.productName}</h3>
                <span><b>Shipping charges 20 AED</b></span>
                <span className="order-price">Amount:{o.price} AED</span>
              </div>
              {o.productDetails && <p className="order-details">{o.productDetails}</p>}

              {exception && (
                <div className={`exception-banner exception-${o.status}`}>
                  {statusLabel(o.status)}
                  {o.status === "cancelled" && o.cancelledAt && ` — ${formatDate(o.cancelledAt)}`}
                  {o.status === "no_answer" && o.noAnswerAt && ` — ${formatDate(o.noAnswerAt)}`}
                </div>
              )}

              <div className="timeline">
                {ORDER_STAGES.map((stage, idx) => {
                  const done = !exception && idx <= currentIdx;
                  const dateVal = o[stage.dateField];
                  return (
                    <div key={stage.key} className={`timeline-step ${done ? "done" : ""}`}>
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <p className="timeline-label">{stage.label}</p>
                        <p className="timeline-date">{done ? formatDate(dateVal) : "Pending"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}