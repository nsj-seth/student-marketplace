import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyOrder, type CustomerOrderDetail } from "../../services/order.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

export function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    void getMyOrder(id)
      .then((response) => setOrder(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="wide-shell"><section className="card wide-card"><p>Loading order...</p></section></main>;

  if (!order) {
    return (
      <main className="wide-shell">
        <section className="card wide-card">
          <h1>Order</h1>
          <p className="message message--error">{error || "Order not found."}</p>
          <Link to="/orders">Back to My Orders</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Placed {dateTime(order.created_at)}</span>
            <h1>{order.order_number}</h1>
          </div>
          <div className="order-heading-actions">
            <span className={`status-chip status-chip--${order.display_status.toLowerCase()}`}>{label(order.display_status)}</span>
            <Link to="/orders">My Orders</Link>
          </div>
        </div>

        {error && <p className="message message--error">{error}</p>}

        <section className="order-customer-grid">
          <div><span>Customer</span><strong>{order.customer_full_name}</strong></div>
          <div><span>Phone</span><strong>{order.customer_phone}</strong></div>
          <div><span>Location</span><strong>{order.customer_location}</strong></div>
          <div><span>Total</span><strong>{money(order.total)}</strong></div>
        </section>

        {order.customer_note && <p className="order-note"><strong>Order note:</strong> {order.customer_note}</p>}

        <div className="seller-order-list">
          {order.seller_orders.map((sellerOrder) => (
            <section className="seller-order-card" key={sellerOrder.id}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{sellerOrder.seller_order_number}</span>
                  <h2>{sellerOrder.business_name}</h2>
                </div>
                <span className="status-chip">{label(sellerOrder.status)}</span>
              </div>

              <div className="seller-order-meta">
                <span>Fulfilment: <strong>{sellerOrder.fulfilment_method === "PICKUP" ? "Customer Pickup" : "Seller Delivery"}</strong></span>
                <span>Subtotal: <strong>{money(sellerOrder.subtotal)}</strong></span>
              </div>

              <div className="order-items-table">
                {sellerOrder.items.map((item) => (
                  <div className="order-item-row" key={item.id}>
                    <div><strong>{item.product_name}</strong><span>{money(item.unit_price)} each</span></div>
                    <span>× {item.quantity}</span>
                    <strong>{money(item.subtotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="order-timeline">
                <h3>Tracking</h3>
                {sellerOrder.timeline.length === 0 ? <p>No tracking events yet.</p> : sellerOrder.timeline.map((entry, index) => (
                  <div className="timeline-entry" key={entry.id}>
                    <div className="timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{label(entry.status)}</strong>
                      <span>{dateTime(entry.created_at)}</span>
                      {entry.note && <p>{entry.note}</p>}
                    </div>
                    {index < sellerOrder.timeline.length - 1 && <div className="timeline-line" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
