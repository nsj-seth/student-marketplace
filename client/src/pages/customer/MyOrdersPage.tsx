import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, type CustomerOrderListItem } from "../../services/order.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

export function MyOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    void getMyOrders().then((response) => setOrders(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return order.active_count > 0;
    return order.completed_count > 0 && order.active_count === 0;
  }), [orders, filter]);

  const active = orders.filter((order) => order.active_count > 0).length;
  const completed = orders.filter((order) => order.completed_count > 0 && order.active_count === 0).length;

  return (
    <main className="wide-shell orders-page">
      <section className="orders-hero">
        <div><span className="eyebrow">My purchases</span><h1>Orders & tracking</h1><p>Follow each seller in your order independently, from acceptance to pickup or delivery.</p></div>
        <Link className="button-link" to="/products">Continue shopping</Link>
      </section>

      <section className="orders-stats">
        <div><span>Total orders</span><strong>{orders.length}</strong></div>
        <div><span>In progress</span><strong>{active}</strong></div>
        <div><span>Completed</span><strong>{completed}</strong></div>
      </section>

      <div className="orders-toolbar">
        <div className="segmented-control">
          <button className={filter === "ALL" ? "is-active" : ""} onClick={() => setFilter("ALL")}>All</button>
          <button className={filter === "ACTIVE" ? "is-active" : ""} onClick={() => setFilter("ACTIVE")}>In progress</button>
          <button className={filter === "COMPLETED" ? "is-active" : ""} onClick={() => setFilter("COMPLETED")}>Completed</button>
        </div>
        <Link to="/profile">Account settings</Link>
      </div>

      {error && <p className="message message--error">{error}</p>}
      {loading && <div className="orders-loading">Loading your orders...</div>}

      {!loading && orders.length === 0 && (
        <div className="empty-state orders-empty"><span className="empty-state__icon">⌁</span><h2>No orders yet</h2><p>Your orders will appear here once you complete checkout.</p><Link className="button-link" to="/products">Browse products</Link></div>
      )}

      {!loading && orders.length > 0 && visibleOrders.length === 0 && <div className="empty-state"><h2>No orders in this view</h2><p>Try another status filter.</p></div>}

      <div className="order-list order-list--premium">
        {visibleOrders.map((order) => (
          <article className="order-card order-card--premium" key={order.id}>
            <div className="order-card__header">
              <div><span className="order-card__date">{dateTime(order.created_at)}</span><h2>{order.order_number}</h2><p>{order.status_summary}</p></div>
              <span className={`status-chip status-chip--${order.display_status.toLowerCase()}`}>{label(order.display_status)}</span>
            </div>

            <div className="order-card__stats">
              <span><strong>{order.seller_order_count}</strong> stores</span>
              <span><strong>{order.active_count}</strong> active</span>
              <span><strong>{order.completed_count}</strong> completed</span>
              {order.rejected_count > 0 && <span><strong>{order.rejected_count}</strong> not fulfilled</span>}
            </div>

            <div className="order-business-summary">
              {order.businesses.map((business) => (
                <div key={business.seller_order_number} className="customer-business-progress customer-business-progress--premium">
                  <div className="customer-business-progress__store"><span className="store-mini-avatar">{business.name.charAt(0).toUpperCase()}</span><div><strong>{business.name}</strong><span>{business.seller_order_number}</span></div></div>
                  <div className="customer-business-progress__status"><span>{business.progress_label}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${business.progress_percent}%` }} /></div></div>
                  <span className="status-chip">{label(business.status)}</span>
                </div>
              ))}
            </div>

            <div className="order-card-footer order-card-footer--premium"><div><span>Order total</span><strong>{money(order.total)}</strong></div><Link className="button-link" to={`/orders/${order.id}`}>Track order</Link></div>
          </article>
        ))}
      </div>
    </main>
  );
}
