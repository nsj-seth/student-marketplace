import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSellerOrder, updateSellerOrderStatus, type SellerOrderDetail } from "../../services/seller-order.service";
import type { SellerOrderStatus } from "../../services/order.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

function nextAction(order: SellerOrderDetail): { status: SellerOrderStatus; label: string } | null {
  if (order.status === "PENDING") return { status: "ACCEPTED", label: "Accept order" };
  if (order.status === "ACCEPTED") return { status: "PREPARING", label: "Start preparing" };
  if (order.status === "PREPARING") return order.fulfilment_method === "PICKUP"
    ? { status: "READY", label: "Mark ready for pickup" }
    : { status: "OUT_FOR_DELIVERY", label: "Mark out for delivery" };
  if (order.status === "READY" || order.status === "OUT_FOR_DELIVERY") return { status: "COMPLETED", label: "Mark completed" };
  return null;
}

export function SellerOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const action = useMemo(() => order ? nextAction(order) : null, [order]);

  function load() {
    if (!id) return;
    setLoading(true);
    void getSellerOrder(id)
      .then((response) => setOrder(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load seller order."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function transition(status: SellerOrderStatus, note?: string) {
    if (!id) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await updateSellerOrderStatus(id, status, note);
      setOrder(response.data ?? null);
      setSuccess(`Order updated to ${label(status)}.`);
      if (status === "REJECTED") setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally { setBusy(false); }
  }

  if (loading) return <main className="wide-shell"><section className="card wide-card"><p>Loading seller order...</p></section></main>;
  if (!order) return <main className="wide-shell"><section className="card wide-card"><h1>Seller order</h1><p className="message message--error">{error || "Order not found."}</p><Link to="/seller/orders">Back to orders</Link></section></main>;

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <div className="section-heading">
          <div><span className="eyebrow">{order.business_name}</span><h1>{order.seller_order_number}</h1><p>Parent order: {order.parent_order_number}</p></div>
          <div className="order-heading-actions"><span className="status-chip">{label(order.status)}</span><Link to="/seller/orders">Seller orders</Link></div>
        </div>

        {error && <p className="message message--error">{error}</p>}
        {success && <p className="message message--success">{success}</p>}

        <section className="order-customer-grid">
          <div><span>Customer</span><strong>{order.customer.full_name}</strong></div>
          <div><span>Phone</span><strong>{order.customer.phone}</strong></div>
          <div><span>Location</span><strong>{order.customer.location}</strong></div>
          <div><span>Fulfilment</span><strong>{order.fulfilment_method === "PICKUP" ? "Customer Pickup" : "Seller Delivery"}</strong></div>
        </section>
        {order.customer.note && <p className="order-note"><strong>Customer note:</strong> {order.customer.note}</p>}

        <section className="seller-order-card">
          <h2>Items</h2>
          <div className="order-items-table">
            {order.items.map((item) => <div className="order-item-row" key={item.id}><div><strong>{item.product_name}</strong><span>{money(item.unit_price)} each</span></div><span>× {item.quantity}</span><strong>{money(item.subtotal)}</strong></div>)}
          </div>
          <p className="seller-order-total">Subtotal: <strong>{money(order.subtotal)}</strong></p>
        </section>

        <section className="seller-order-actions-panel">
          <h2>Update order</h2>
          {action && <button disabled={busy} onClick={() => void transition(action.status)}>{busy ? "Updating..." : action.label}</button>}
          {order.status === "PENDING" && (
            <div className="reject-order-box">
              <label>Rejection reason
                <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Explain why the order cannot be accepted." />
              </label>
              <button className="danger-button" disabled={busy || rejectReason.trim().length < 3} onClick={() => void transition("REJECTED", rejectReason)}>Reject order</button>
            </div>
          )}
          {!action && !["PENDING"].includes(order.status) && <p>This order is in a terminal state and cannot be advanced further.</p>}
        </section>

        <section className="order-timeline">
          <h2>Order timeline</h2>
          {order.timeline.map((entry, index) => <div className="timeline-entry" key={entry.id}><div className="timeline-dot" /><div><strong>{label(entry.status)}</strong><span>{dateTime(entry.created_at)}</span>{entry.note && <p>{entry.note}</p>}</div>{index < order.timeline.length - 1 && <div className="timeline-line" />}</div>)}
        </section>
      </section>
    </main>
  );
}
