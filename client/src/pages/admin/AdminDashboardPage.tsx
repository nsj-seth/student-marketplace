import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard, type AdminDashboardData } from "../../services/admin-dashboard.service";

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then((response) => setData(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load admin dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="wide-shell"><section className="card wide-card"><p>Loading admin dashboard...</p></section></main>;

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Administration</span>
        <h1>Marketplace overview</h1>
        <p>Operational totals and recent marketplace activity.</p>
        {error && <p className="message message--error">{error}</p>}

        {data && (
          <>
            <div className="admin-metric-grid">
              <article><span>Total users</span><strong>{data.metrics.totalUsers}</strong><small>{data.metrics.activeUsers} active · {data.metrics.suspendedUsers} suspended</small></article>
              <article><span>Customers</span><strong>{data.metrics.customers}</strong></article>
              <article><span>Sellers</span><strong>{data.metrics.sellers}</strong></article>
              <article><span>Businesses</span><strong>{data.metrics.totalBusinesses}</strong><small>{data.metrics.activeBusinesses} active</small></article>
              <article><span>Student businesses</span><strong>{data.metrics.studentBusinesses}</strong></article>
              <article><span>Other businesses</span><strong>{data.metrics.otherBusinesses}</strong></article>
              <article><span>Products</span><strong>{data.metrics.totalProducts}</strong><small>{data.metrics.publicProducts} public</small></article>
              <article><span>Orders</span><strong>{data.metrics.totalOrders}</strong><small>{data.metrics.completedOrders} completed</small></article>
              <article><span>Pending applications</span><strong>{data.metrics.pendingSellerApplications}</strong></article>
              <article><span>Pending reports</span><strong>{data.metrics.pendingReports}</strong></article>
              <article><span>Orders · last 30 days</span><strong>{data.metrics.ordersLast30Days}</strong></article>
              <article><span>Order value · last 30 days</span><strong>{money(data.metrics.orderValueLast30Days)}</strong><small>Order value, not captured payments</small></article>
            </div>

            <div className="admin-dashboard-columns">
              <section className="admin-dashboard-panel">
                <h2>Order status</h2>
                {data.orderStatusBreakdown.length === 0 ? <p>No orders yet.</p> : data.orderStatusBreakdown.map((item) => <div className="admin-stat-row" key={item.status}><span>{item.status.replaceAll("_", " ")}</span><strong>{item.count}</strong></div>)}
              </section>
              <section className="admin-dashboard-panel">
                <h2>Seller-order status</h2>
                {data.sellerOrderStatusBreakdown.length === 0 ? <p>No seller orders yet.</p> : data.sellerOrderStatusBreakdown.map((item) => <div className="admin-stat-row" key={item.status}><span>{item.status.replaceAll("_", " ")}</span><strong>{item.count}</strong></div>)}
              </section>
            </div>

            <section className="admin-dashboard-panel">
              <div className="section-heading"><h2>Recent orders</h2><Link to="/admin/orders">View all orders</Link></div>
              {data.recentOrders.length === 0 ? <p>No orders yet.</p> : (
                <div className="admin-compact-list">
                  {data.recentOrders.map((order) => (
                    <Link to={`/admin/orders/${order.id}`} key={order.id}>
                      <div><strong>{order.order_number}</strong><span>{order.customer_full_name}</span></div>
                      <div><strong>{money(order.total)}</strong><span>{order.status} · {order.seller_order_count} seller order{order.seller_order_count === 1 ? "" : "s"}</span><small>{formatDate(order.created_at)}</small></div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-dashboard-panel">
              <h2>Top businesses by completed order value</h2>
              {data.topBusinesses.length === 0 ? <p>No completed seller orders yet.</p> : (
                <div className="admin-compact-list">
                  {data.topBusinesses.map((business) => (
                    <div className="admin-compact-row" key={business.business_id}>
                      <div><strong>{business.business_name}</strong><span>{business.completed_orders} completed seller order{business.completed_orders === 1 ? "" : "s"}</span></div>
                      <strong>{money(business.completed_value)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="admin-link-grid">
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/seller-applications">Seller applications</Link>
          <Link to="/admin/businesses">Businesses</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/reports">Reports</Link>
          <Link to="/admin/reference-data">Universities & categories</Link>
          <Link to="/admin/marketplace">Marketplace management</Link>
        </div>
      </section>
    </main>
  );
}
