import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard, type AdminDashboardData } from "../../services/admin-dashboard.service";

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function metricTone(value: number) {
  return value > 0 ? "admin-metric-card--attention" : "admin-metric-card--quiet";
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

  const completionRate = useMemo(() => {
    if (!data || data.metrics.totalOrders === 0) return 0;
    return Math.round((data.metrics.completedOrders / data.metrics.totalOrders) * 100);
  }, [data]);

  if (loading) {
    return (
      <main className="wide-shell admin-hub-page">
        <section className="admin-loading-panel">
          <span className="admin-loading-panel__pulse" />
          <div>
            <strong>Loading control center</strong>
            <p>Fetching marketplace operations and moderation data.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="wide-shell admin-hub-page">
      <section className="admin-hero-panel">
        <div>
          <span className="eyebrow">Marketplace control center</span>
          <h1>Admin overview</h1>
          <p>Monitor marketplace health, review priority work, and jump into the areas that need attention.</p>
        </div>
        <div className="admin-hero-panel__actions">
          <Link className="button-link" to="/admin/seller-applications">Review sellers</Link>
          <Link className="button-link button-link--secondary" to="/admin/reports">Moderation queue</Link>
        </div>
      </section>

      {error && <p className="message message--error">{error}</p>}

      {data && (
        <>
          <section className="admin-priority-grid" aria-label="Priority admin tasks">
            <Link className={`admin-priority-card ${data.metrics.pendingSellerApplications > 0 ? "is-active" : ""}`} to="/admin/seller-applications">
              <span className="admin-priority-card__icon">SA</span>
              <div>
                <small>Seller applications</small>
                <strong>{data.metrics.pendingSellerApplications}</strong>
                <p>{data.metrics.pendingSellerApplications > 0 ? "Awaiting admin decision" : "Nothing waiting"}</p>
              </div>
              <span className="admin-priority-card__arrow">→</span>
            </Link>
            <Link className={`admin-priority-card ${data.metrics.pendingReports > 0 ? "is-active" : ""}`} to="/admin/reports">
              <span className="admin-priority-card__icon">MR</span>
              <div>
                <small>Moderation reports</small>
                <strong>{data.metrics.pendingReports}</strong>
                <p>{data.metrics.pendingReports > 0 ? "Needs moderation review" : "Queue is clear"}</p>
              </div>
              <span className="admin-priority-card__arrow">→</span>
            </Link>
            <Link className="admin-priority-card" to="/admin/orders">
              <span className="admin-priority-card__icon">30D</span>
              <div>
                <small>Orders · 30 days</small>
                <strong>{data.metrics.ordersLast30Days}</strong>
                <p>{money(data.metrics.orderValueLast30Days)} in order value</p>
              </div>
              <span className="admin-priority-card__arrow">→</span>
            </Link>
          </section>

          <section>
            <div className="admin-section-heading">
              <div>
                <span className="admin-section-kicker">Marketplace health</span>
                <h2>Core metrics</h2>
              </div>
              <span className="admin-section-note">Live operational totals</span>
            </div>

            <div className="admin-metric-grid admin-metric-grid--premium">
              <article className="admin-metric-card">
                <span>Users</span>
                <strong>{data.metrics.totalUsers}</strong>
                <small>{data.metrics.activeUsers} active · {data.metrics.suspendedUsers} suspended</small>
              </article>
              <article className="admin-metric-card">
                <span>Sellers</span>
                <strong>{data.metrics.sellers}</strong>
                <small>{data.metrics.customers} customer role accounts</small>
              </article>
              <article className="admin-metric-card">
                <span>Businesses</span>
                <strong>{data.metrics.totalBusinesses}</strong>
                <small>{data.metrics.activeBusinesses} active</small>
              </article>
              <article className="admin-metric-card">
                <span>Products</span>
                <strong>{data.metrics.totalProducts}</strong>
                <small>{data.metrics.publicProducts} public</small>
              </article>
              <article className="admin-metric-card">
                <span>Total orders</span>
                <strong>{data.metrics.totalOrders}</strong>
                <small>{data.metrics.completedOrders} completed</small>
              </article>
              <article className="admin-metric-card">
                <span>Completion rate</span>
                <strong>{completionRate}%</strong>
                <small>Completed marketplace orders</small>
              </article>
              <article className={`admin-metric-card ${metricTone(data.metrics.pendingSellerApplications)}`}>
                <span>Applications</span>
                <strong>{data.metrics.pendingSellerApplications}</strong>
                <small>Pending seller review</small>
              </article>
              <article className={`admin-metric-card ${metricTone(data.metrics.pendingReports)}`}>
                <span>Reports</span>
                <strong>{data.metrics.pendingReports}</strong>
                <small>Pending moderation</small>
              </article>
            </div>
          </section>

          <section className="admin-insight-grid">
            <article className="admin-dashboard-panel admin-dashboard-panel--status">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-section-kicker">Orders</span>
                  <h2>Overall status</h2>
                </div>
                <Link to="/admin/orders">View orders</Link>
              </div>
              {data.orderStatusBreakdown.length === 0 ? (
                <div className="admin-empty-inline"><strong>No orders yet</strong><span>Status totals will appear here.</span></div>
              ) : (
                <div className="admin-status-list">
                  {data.orderStatusBreakdown.map((item) => (
                    <div className="admin-stat-row" key={item.status}>
                      <span>{item.status.replaceAll("_", " ")}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="admin-dashboard-panel admin-dashboard-panel--status">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-section-kicker">Fulfilment</span>
                  <h2>Seller-order status</h2>
                </div>
              </div>
              {data.sellerOrderStatusBreakdown.length === 0 ? (
                <div className="admin-empty-inline"><strong>No seller orders yet</strong><span>Seller fulfilment activity will appear here.</span></div>
              ) : (
                <div className="admin-status-list">
                  {data.sellerOrderStatusBreakdown.map((item) => (
                    <div className="admin-stat-row" key={item.status}>
                      <span>{item.status.replaceAll("_", " ")}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="admin-dashboard-grid">
            <article className="admin-dashboard-panel admin-dashboard-panel--large">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-section-kicker">Latest activity</span>
                  <h2>Recent orders</h2>
                </div>
                <Link to="/admin/orders">View all</Link>
              </div>

              {data.recentOrders.length === 0 ? (
                <div className="admin-empty-inline"><strong>No orders yet</strong><span>New marketplace orders will appear here.</span></div>
              ) : (
                <div className="admin-compact-list admin-compact-list--premium">
                  {data.recentOrders.map((order) => (
                    <Link to={`/admin/orders/${order.id}`} key={order.id}>
                      <div>
                        <strong>{order.order_number}</strong>
                        <span>{order.customer_full_name}</span>
                      </div>
                      <div>
                        <strong>{money(order.total)}</strong>
                        <span>{order.status.replaceAll("_", " ")} · {order.seller_order_count} seller order{order.seller_order_count === 1 ? "" : "s"}</span>
                        <small>{formatDate(order.created_at)}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            <article className="admin-dashboard-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-section-kicker">Performance</span>
                  <h2>Top businesses</h2>
                </div>
                <Link to="/admin/businesses">Manage</Link>
              </div>
              {data.topBusinesses.length === 0 ? (
                <div className="admin-empty-inline"><strong>No completed sales yet</strong><span>Business performance will appear here.</span></div>
              ) : (
                <div className="admin-top-business-list">
                  {data.topBusinesses.map((business, index) => (
                    <div className="admin-top-business-row" key={business.business_id}>
                      <span className="admin-rank">{index + 1}</span>
                      <div>
                        <strong>{business.business_name}</strong>
                        <small>{business.completed_orders} completed order{business.completed_orders === 1 ? "" : "s"}</small>
                      </div>
                      <strong>{money(business.completed_value)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="admin-quick-actions">
            <div className="admin-section-heading">
              <div>
                <span className="admin-section-kicker">Operations</span>
                <h2>Manage marketplace</h2>
              </div>
            </div>
            <div className="admin-link-grid admin-link-grid--premium">
              <Link to="/admin/users"><span>US</span><div><strong>Users</strong><small>Roles and account status</small></div></Link>
              <Link to="/admin/seller-applications"><span>SA</span><div><strong>Seller applications</strong><small>Review marketplace access</small></div></Link>
              <Link to="/admin/businesses"><span>BS</span><div><strong>Businesses</strong><small>Storefront status and owners</small></div></Link>
              <Link to="/admin/products"><span>PD</span><div><strong>Products</strong><small>Listings, stock and moderation</small></div></Link>
              <Link to="/admin/orders"><span>OR</span><div><strong>Orders</strong><small>Marketplace fulfilment view</small></div></Link>
              <Link to="/admin/reports"><span>RP</span><div><strong>Reports</strong><small>Moderation queue</small></div></Link>
              <Link to="/admin/marketplace"><span>FT</span><div><strong>Featured listings</strong><small>Homepage marketplace curation</small></div></Link>
              <Link to="/admin/reference-data"><span>RF</span><div><strong>Reference data</strong><small>Universities and categories</small></div></Link>
            </div>
          </section>

          <section className="admin-business-mix">
            <div>
              <span className="admin-section-kicker">Business mix</span>
              <strong>{data.metrics.studentBusinesses}</strong>
              <small>Student businesses</small>
            </div>
            <div>
              <span className="admin-section-kicker">Business mix</span>
              <strong>{data.metrics.otherBusinesses}</strong>
              <small>Other businesses</small>
            </div>
            <div>
              <span className="admin-section-kicker">30-day value</span>
              <strong>{money(data.metrics.orderValueLast30Days)}</strong>
              <small>Order value, not captured payments</small>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
