import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { statusLabel, formatDate } from "../utils/orderStages";
import { generateInvoicePDF } from "../utils/Invoicepdf";
import { SHIPPING_CHARGE, parseAmount, formatAED } from "../utils/Pricing";

export default function InvoicePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [child, setChild] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const orderSnap = await getDoc(doc(db, "orders", orderId));
        if (!orderSnap.exists()) {
          setError("Order not found.");
          return;
        }
        const orderData = { id: orderSnap.id, ...orderSnap.data() };
        setOrder(orderData);

        const [childSnap, adminSnap] = await Promise.all([
          orderData.childId ? getDoc(doc(db, "users", orderData.childId)) : null,
          orderData.createdBy ? getDoc(doc(db, "users", orderData.createdBy)) : null,
        ]);
        if (childSnap?.exists()) setChild({ id: childSnap.id, ...childSnap.data() });
        if (adminSnap?.exists()) setAdmin({ id: adminSnap.id, ...adminSnap.data() });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  if (loading) return <div className="loading">Loading invoice...</div>;

  if (error) {
    return (
      <div className="dashboard">
        <p className="error">{error}</p>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  const invoiceNumber = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="invoice-page">
      <div className="invoice-toolbar no-print">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="print-btn" onClick={() => window.print()}>Print</button>
          <button
            className="download-btn"
            onClick={() => generateInvoicePDF(order, child, admin)}
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="invoice-sheet">
        <div className="invoice-header">
          <div>
            <h1>INVOICE</h1>
            <p className="invoice-meta">Invoice #{invoiceNumber}</p>
            <p className="invoice-meta">Date: {formatDate(order.orderedAt)}</p>
          </div>
          <span className={`status-badge status-${order.status}`}>
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="invoice-parties">
          <div>
            <h4>From</h4>
            <p>{admin?.name || "—"}</p>
            <p>{admin?.email || "—"}</p>
          </div>
          <div>
            <h4>Bill To</h4>
            <p>{child?.name || "—"}</p>
            <p>{child?.email || "—"}</p>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Details</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{order.productName}</td>
              <td>{order.productDetails || "—"}</td>
              <td>{order.price}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="invoice-subtotal-row">
              <td colSpan={2}>Shipping Charges</td>
              <td>{formatAED(order.shippingCharges ?? SHIPPING_CHARGE)}</td>
            </tr>
            <tr className="invoice-total-row">
              <td colSpan={2}>Total</td>
              <td>
                {formatAED(
                  parseAmount(order.price) + parseAmount(order.shippingCharges ?? SHIPPING_CHARGE)
                )}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="invoice-footer">
          <p>Thank you for your order.</p>
        </div>
      </div>
    </div>
  );
}