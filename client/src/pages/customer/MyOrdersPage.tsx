import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, type CustomerOrderListItem } from "../../services/order.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

export function MyOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void getMyOrders()
      .then((response) => setOrders(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <div className="section-heading">
          <div><span className="eyebrow">Customer</span><h1>My Orders</h1></div>
          <Link to="/">Marketplace</Link>
        </div>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading your orders...</p>}

        {!loading && orders.length === 0 && (
          <div className="empty-state">
            <h2>No orders yet</h2>
            <p>Once you place an order, it will appear here.</p>
            <Link className="button-link" to="/products">Browse products</Link>
          </div>
        )}

        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{dateTime(order.created_at)}</span>
                  <h2>{order.order_number}</h2>
                  <p className="muted-text">{order.status_summary}</p>
                </div>
                <span className={`status-chip status-chip--${order.display_status.toLowerCase()}`}>
                  {label(order.display_status)}
                </span>
              </div>

              <div className="order-summary-strip">
                <span><strong>{order.seller_order_count}</strong> seller order{order.seller_order_count === 1 ? "" : "s"}</span>
                <span><strong>{order.active_count}</strong> active</span>
                <span><strong>{order.completed_count}</strong> completed</span>
                {order.rejected_count > 0 && <span><strong>{order.rejected_count}</strong> not fulfilled</span>}
              </div>

              <div className="order-business-summary">
                {order.businesses.map((business) => (
                  <div key={business.seller_order_number} className="customer-business-progress">
                    <div>
                      <strong>{business.name}</strong>
                      <span>{business.seller_order_number}</span>
                    </div>
                    <div className="customer-business-progress__status">
                      <span>{business.progress_label}</span>
                      <div className="progress-track" aria-label={`${business.name} order progress`}>
                        <div className="progress-fill" style={{ width: `${business.progress_percent}%` }} />
                      </div>
                    </div>
                    <span className="status-chip">{label(business.status)}</span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <strong>{money(order.total)}</strong>
                <Link className="button-link" to={`/orders/${order.id}`}>View order</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
