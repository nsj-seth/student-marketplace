import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminOrder, type AdminOrderDetail } from "../../services/admin-order.service";

function money(value: number) { return `GH₵${value.toFixed(2)}`; }
function dateTime(value: string) { return new Date(value).toLocaleString(); }

export function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminOrder(id).then((response) => setOrder(response.data ?? null)).catch((err) => setError(err instanceof Error ? err.message : "Unable to load order.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="wide-shell"><section className="card wide-card"><p>Loading order...</p></section></main>;
  if (error || !order) return <main className="wide-shell"><section className="card wide-card"><p className="message message--error">{error || "Order not found."}</p><Link to="/admin/orders">Back to orders</Link></section></main>;

  return <main className="wide-shell"><section className="card wide-card">
    <span className="eyebrow">Admin order review</span><h1>{order.order_number}</h1><p><strong>Status:</strong> {order.display_status.replaceAll("_", " ")} · <strong>Total:</strong> {money(order.total)}</p>
    <div className="order-customer-block"><h2>Customer</h2><p><strong>{order.customer_name}</strong></p><p>{order.customer_phone}</p><p>{order.customer_location}</p>{order.customer_note && <p><strong>Note:</strong> {order.customer_note}</p>}<p>Placed {dateTime(order.created_at)}</p></div>
    <h2>Seller orders</h2>
    <div className="admin-user-list">{order.seller_orders.map((sellerOrder) => <article className="admin-user-card" key={sellerOrder.id}>
      <div className="admin-user-card__heading"><div><strong>{sellerOrder.business_name}</strong><p>{sellerOrder.seller_order_number}</p></div><span className="status-chip">{sellerOrder.status.replaceAll("_", " ")}</span></div>
      <p><strong>Fulfilment:</strong> {sellerOrder.fulfilment_method === "PICKUP" ? "Customer pickup" : "Seller delivery"}</p><p><strong>Subtotal:</strong> {money(sellerOrder.subtotal)}</p>
      <h3>Items</h3>{sellerOrder.items.map((item) => <p key={item.id}>{item.quantity} × {item.product_name} @ {money(item.unit_price)} = <strong>{money(item.subtotal)}</strong></p>)}
      <h3>Timeline</h3>{sellerOrder.timeline.length === 0 ? <p>No timeline entries.</p> : <ol>{sellerOrder.timeline.map((entry) => <li key={entry.id}><strong>{entry.status.replaceAll("_", " ")}</strong> — {dateTime(entry.created_at)}{entry.note ? ` — ${entry.note}` : ""}</li>)}</ol>}
    </article>)}</div>
    <div className="actions"><Link className="button-link button-link--secondary" to="/admin/orders">Back to orders</Link><Link className="button-link button-link--secondary" to={`/orders/${order.id}`}>Customer view route</Link></div>
  </section></main>;
}
