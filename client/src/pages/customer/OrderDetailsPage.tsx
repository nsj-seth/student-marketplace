import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyOrder, type CustomerOrderDetail, type SellerOrderStatus } from "../../services/order.service";
import { OrderReviewPanel } from "../../components/reviews/OrderReviewPanel";

const money = (value: number) => `GH₵${value.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

function timelineLabel(status: SellerOrderStatus, fulfilment: "PICKUP" | "SELLER_DELIVERY") {
  switch (status) {
    case "PENDING": return "Order sent to seller";
    case "ACCEPTED": return "Seller accepted your order";
    case "PREPARING": return "Seller is preparing your order";
    case "READY": return "Ready for pickup";
    case "OUT_FOR_DELIVERY": return "Out for delivery";
    case "COMPLETED": return "Order completed";
    case "REJECTED": return "Seller could not fulfil this order";
    case "CANCELLED": return "Order cancelled";
    default: return fulfilment === "PICKUP" ? "Pickup order update" : "Delivery order update";
  }
}

export function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) { setError("Order ID is missing."); setLoading(false); return; }
    void getMyOrder(id).then((response) => setOrder(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="wide-shell"><div className="orders-loading">Loading order details...</div></main>;
  if (!order) return <main className="wide-shell"><section className="card wide-card"><h1>Order</h1><p className="message message--error">{error || "Order not found."}</p><Link to="/orders">Back to My Orders</Link></section></main>;

  return (
    <main className="wide-shell order-detail-page">
      <div className="order-detail-breadcrumb"><Link to="/orders">← My orders</Link><span>/</span><span>{order.order_number}</span></div>

      <section className="order-detail-hero">
        <div><span className="eyebrow">Placed {dateTime(order.created_at)}</span><h1>{order.order_number}</h1><p>{order.status_summary}</p></div>
        <div className="order-detail-hero__side"><span className={`status-chip status-chip--${order.display_status.toLowerCase()}`}>{label(order.display_status)}</span><strong>{money(order.total)}</strong></div>
      </section>

      {error && <p className="message message--error">{error}</p>}

      <section className="order-overview-panel order-overview-panel--premium">
        <div><span>Seller orders</span><strong>{order.seller_order_count}</strong></div>
        <div><span>Active</span><strong>{order.active_count}</strong></div>
        <div><span>Completed</span><strong>{order.completed_count}</strong></div>
        <div><span>Not fulfilled</span><strong>{order.rejected_count}</strong></div>
      </section>

      <section className="order-customer-card card">
        <div className="section-heading"><div><span className="eyebrow">Delivery details</span><h2>Customer information</h2></div></div>
        <div className="order-customer-grid order-customer-grid--premium">
          <div><span>Customer</span><strong>{order.customer_full_name}</strong></div>
          <div><span>Phone</span><strong>{order.customer_phone}</strong></div>
          <div><span>Location</span><strong>{order.customer_location}</strong></div>
          <div><span>Total</span><strong>{money(order.total)}</strong></div>
        </div>
        {order.customer_note && <p className="order-note"><strong>Order note:</strong> {order.customer_note}</p>}
      </section>

      <div className="seller-order-list seller-order-list--premium">
        {order.seller_orders.map((sellerOrder) => (
          <section className="seller-order-card seller-order-card--premium" key={sellerOrder.id}>
            <div className="seller-order-card__top">
              <div className="seller-order-card__identity"><span className="store-avatar">{sellerOrder.business_name.charAt(0).toUpperCase()}</span><div><span className="eyebrow">{sellerOrder.seller_order_number}</span><h2>{sellerOrder.business_name}</h2><p>{sellerOrder.progress_label}</p></div></div>
              <span className="status-chip">{label(sellerOrder.status)}</span>
            </div>

            <div className="seller-progress-block seller-progress-block--premium"><div><span>Order progress</span><strong>{sellerOrder.progress_percent}%</strong></div><div className="progress-track progress-track--large"><div className="progress-fill" style={{ width: `${sellerOrder.progress_percent}%` }} /></div></div>

            {sellerOrder.rejection_reason && <div className="order-rejection-box"><strong>Why this seller order was not fulfilled</strong><p>{sellerOrder.rejection_reason}</p></div>}

            <div className="seller-order-meta seller-order-meta--premium"><span>Fulfilment<strong>{sellerOrder.fulfilment_method === "PICKUP" ? "Customer Pickup" : "Seller Delivery"}</strong></span><span>Subtotal<strong>{money(sellerOrder.subtotal)}</strong></span></div>

            <div className="order-items-table order-items-table--premium">
              {sellerOrder.items.map((item) => <div className="order-item-row" key={item.id}><div><strong>{item.product_name}</strong><span>{money(item.unit_price)} each</span></div><span>× {item.quantity}</span><strong>{money(item.subtotal)}</strong></div>)}
            </div>

            <div className="order-timeline order-timeline--premium">
              <h3>Tracking timeline</h3>
              {sellerOrder.timeline.length === 0 ? <p>No tracking events yet.</p> : sellerOrder.timeline.map((entry, index) => (
                <div className="timeline-entry" key={entry.id}><div className="timeline-dot" aria-hidden="true" /><div><strong>{timelineLabel(entry.status, sellerOrder.fulfilment_method)}</strong><span>{dateTime(entry.created_at)}</span>{entry.note && <p>{entry.note}</p>}</div>{index < sellerOrder.timeline.length - 1 && <div className="timeline-line" aria-hidden="true" />}</div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <OrderReviewPanel orderId={order.id} />
    </main>
  );
}
