import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBusinesses, type ManagedBusiness } from "../../services/business.service";
import { getSellerOrders, type SellerOrderListItem } from "../../services/seller-order.service";

function money(value: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(value);
}

export function SellerDashboardPage() {
  const [businesses, setBusinesses] = useState<ManagedBusiness[]>([]);
  const [orders, setOrders] = useState<SellerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMyBusinesses(), getSellerOrders({ group: "all" })])
      .then(([businessResponse, orderResponse]) => {
        setBusinesses(businessResponse.data ?? []);
        setOrders(orderResponse.data ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load seller dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const pending = orders.filter((order) => order.status === "PENDING").length;
    const active = orders.filter((order) => ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(order.status)).length;
    const completed = orders.filter((order) => order.status === "COMPLETED");
    const completedValue = completed.reduce((sum, order) => sum + order.subtotal, 0);
    return { pending, active, completed: completed.length, completedValue };
  }, [orders]);

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <main className="wide-shell seller-hub-page">
      <section className="seller-hero-panel">
        <div>
          <span className="eyebrow">Seller Hub</span>
          <h1>Run your marketplace business from one place.</h1>
          <p>Track stores, orders and fulfilment while keeping the customer side only one click away.</p>
        </div>
        <div className="seller-hero-panel__actions">
          <Link className="button-link" to="/seller/businesses">Manage businesses</Link>
          <Link className="button-link button-link--secondary" to="/sell">Seller applications</Link>
        </div>
      </section>

      {error && <p className="message message--error">{error}</p>}
      {loading ? <section className="card"><p>Loading your seller workspace...</p></section> : (
        <>
          <section className="seller-metric-grid" aria-label="Seller overview">
            <article className="seller-metric-card"><span>Businesses</span><strong>{businesses.length}</strong><small>{businesses.filter((business) => business.availability_status === "OPEN").length} currently open</small></article>
            <article className="seller-metric-card"><span>New orders</span><strong>{metrics.pending}</strong><small>Waiting for your response</small></article>
            <article className="seller-metric-card"><span>In progress</span><strong>{metrics.active}</strong><small>Accepted or being fulfilled</small></article>
            <article className="seller-metric-card"><span>Completed value</span><strong>{money(metrics.completedValue)}</strong><small>{metrics.completed} completed orders</small></article>
          </section>

          <div className="seller-dashboard-grid">
            <section className="card seller-dashboard-section">
              <div className="section-heading"><div><span className="eyebrow">Businesses</span><h2>Your stores</h2></div><Link to="/seller/businesses">View all</Link></div>
              {businesses.length === 0 ? (
                <div className="empty-state"><h3>No approved businesses yet</h3><p>Start or continue a seller application to create your first storefront.</p><Link className="button-link" to="/sell">Start selling</Link></div>
              ) : (
                <div className="seller-store-list">
                  {businesses.slice(0, 4).map((business) => (
                    <article className="seller-store-row" key={business.id}>
                      <div className="seller-store-row__identity"><span className="seller-store-avatar">{business.name.slice(0,1).toUpperCase()}</span><div><strong>{business.name}</strong><small>{business.location_text}</small></div></div>
                      <div className="seller-store-row__meta"><span className={`status-chip ${business.availability_status === "OPEN" ? "status-chip--success" : ""}`}>{business.availability_status === "OPEN" ? "Open" : "Unavailable"}</span><Link to={`/seller/businesses/${business.id}`}>Manage</Link></div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="card seller-dashboard-section">
              <div className="section-heading"><div><span className="eyebrow">Orders</span><h2>Recent activity</h2></div><Link to="/seller/orders">View orders</Link></div>
              {recentOrders.length === 0 ? <div className="empty-state"><h3>No orders yet</h3><p>New customer orders will appear here.</p></div> : (
                <div className="seller-recent-orders">
                  {recentOrders.map((order) => <Link className="seller-recent-order" to={`/seller/orders/${order.id}`} key={order.id}><div><strong>{order.seller_order_number}</strong><small>{order.business_name} · {order.customer_full_name}</small></div><div><strong>{money(order.subtotal)}</strong><span className="status-chip">{order.status.replaceAll("_", " ")}</span></div></Link>)}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
