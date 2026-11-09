import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileWarning,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminMetricCard, AdminPageHeader } from "../../components/admin/AdminUi";
import { getAdminDashboard, type AdminDashboardData } from "../../services/admin-dashboard.service";

function money(value: number) {
  return "GH₵" + value.toFixed(2);
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

  const completionRate = useMemo(() => {
    if (!data || data.metrics.totalOrders === 0) return 0;
    return Math.round((data.metrics.completedOrders / data.metrics.totalOrders) * 100);
  }, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <AdminPageHeader
        eyebrow="Marketplace control center"
        title="Admin overview"
        description="Monitor marketplace health, review priority work and manage the areas that need attention."
        icon={<ClipboardCheck className="size-3.5" />}
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to="/admin/seller-applications"
            >
              Review sellers
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
              to="/admin/reports"
            >
              Moderation queue
            </Link>
          </>
        }
      />

      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      {data && (
        <>
          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <Link
              to="/admin/seller-applications"
              className="group rounded-2xl border border-primary bg-primary text-primary-foreground p-6 shadow-sm transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-white">Seller applications</span>
                <span className="flex shrink-0 items-center gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-white">
                  <Store className="size-5" />
                </span>
                <ArrowRight className="size-4 text-white transition group-hover:text-white" />
              </span>
              </div>
              <strong className="mt-5 block text-3xl font-semibold tracking-tight">{data.metrics.pendingSellerApplications}</strong>
              <p className="mt-4 text-sm text-white">
                {data.metrics.pendingSellerApplications > 0 ? "Awaiting admin decision" : "Nothing waiting"}
              </p>
            </Link>

            <Link
              to="/admin/reports"
              className="group rounded-2xl border border-border bg-card text-foreground p-6 shadow-sm transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Moderation reports</span>
                <span className="flex shrink-0 items-center gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-danger-soft text-danger-foreground">
                  <FileWarning className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:text-primary-text" />
              </span>
              </div>
              <strong className="mt-5 block text-3xl font-semibold tracking-tight">{data.metrics.pendingReports}</strong>
              <p className="mt-4 text-sm text-muted-foreground">
                {data.metrics.pendingReports > 0 ? "Needs moderation review" : "Queue is clear"}
              </p>
            </Link>

            <Link
              to="/admin/orders"
              className="group rounded-2xl border border-border bg-card text-foreground p-6 shadow-sm transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Orders · 30 days</span>
                <span className="flex shrink-0 items-center gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-info-soft text-info-foreground">
                  <TrendingUp className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:text-primary-text" />
              </span>
              </div>
              <strong className="mt-5 block text-3xl font-semibold tracking-tight">{data.metrics.ordersLast30Days}</strong>
              <p className="mt-4 text-sm text-muted-foreground">
                {money(data.metrics.orderValueLast30Days)} in order value
              </p>
            </Link>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              label="Users"
              value={data.metrics.totalUsers}
              hint={data.metrics.activeUsers + " active · " + data.metrics.suspendedUsers + " suspended"}
              icon={<Users className="size-5" />}
            />
            <AdminMetricCard
              label="Sellers"
              value={data.metrics.sellers}
              hint={data.metrics.customers + " customer role accounts"}
              icon={<Store className="size-5" />}
              tone="blue"
            />
            <AdminMetricCard
              label="Businesses"
              value={data.metrics.totalBusinesses}
              hint={data.metrics.activeBusinesses + " active"}
              icon={<Building2 className="size-5" />}
            />
            <AdminMetricCard
              label="Products"
              value={data.metrics.totalProducts}
              hint={data.metrics.publicProducts + " public"}
              icon={<ShoppingBag className="size-5" />}
            />
            <AdminMetricCard
              label="Total orders"
              value={data.metrics.totalOrders}
              hint={data.metrics.completedOrders + " completed"}
              icon={<Package className="size-5" />}
              tone="blue"
            />
            <AdminMetricCard
              label="Completion rate"
              value={completionRate + "%"}
              hint="Completed marketplace orders"
              icon={<TrendingUp className="size-5" />}
              tone="success"
            />
            <AdminMetricCard
              label="Applications"
              value={data.metrics.pendingSellerApplications}
              hint="Pending seller review"
              icon={<Store className="size-5" />}
              tone={data.metrics.pendingSellerApplications > 0 ? "warning" : "primary"}
            />
            <AdminMetricCard
              label="Reports"
              value={data.metrics.pendingReports}
              hint="Pending moderation"
              icon={<FileWarning className="size-5" />}
              tone={data.metrics.pendingReports > 0 ? "danger" : "primary"}
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Orders</span>
                  <h2 className="mt-1 text-lg font-semibold">Overall status</h2>
                </div>
                <Link className="text-sm font-semibold text-primary-text" to="/admin/orders">View orders</Link>
              </div>
              <div className="divide-y divide-border">
                {data.orderStatusBreakdown.map((item) => (
                  <div className="flex items-center justify-between p-4" key={item.status}>
                    <span className="text-sm text-muted-foreground">{item.status.replaceAll("_", " ")}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5">
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Fulfilment</span>
                <h2 className="mt-1 text-lg font-semibold">Seller-order status</h2>
              </div>
              <div className="divide-y divide-border">
                {data.sellerOrderStatusBreakdown.map((item) => (
                  <div className="flex items-center justify-between p-4" key={item.status}>
                    <span className="text-sm text-muted-foreground">{item.status.replaceAll("_", " ")}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
            <article className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Latest activity</span>
                  <h2 className="mt-1 text-lg font-semibold">Recent orders</h2>
                </div>
                <Link className="text-sm font-semibold text-primary-text" to="/admin/orders">View all</Link>
              </div>
              <div className="divide-y divide-border">
                {data.recentOrders.map((order) => (
                  <Link
                    className="flex flex-col gap-2 p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                    to={"/admin/orders/" + order.id}
                    key={order.id}
                  >
                    <div>
                      <strong className="block text-sm">{order.order_number}</strong>
                      <span className="text-xs text-muted-foreground">{order.customer_full_name}</span>
                    </div>
                    <div className="sm:text-right">
                      <strong className="block text-sm">{money(order.total)}</strong>
                      <span className="block text-xs text-muted-foreground">
                        {order.status.replaceAll("_", " ")} · {order.seller_order_count} seller order{order.seller_order_count === 1 ? "" : "s"}
                      </span>
                      <small className="text-xs text-muted-foreground">{formatDate(order.created_at)}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Performance</span>
                  <h2 className="mt-1 text-lg font-semibold">Top businesses</h2>
                </div>
                <Link className="text-sm font-semibold text-primary-text" to="/admin/businesses">Manage</Link>
              </div>
              <div className="divide-y divide-border">
                {data.topBusinesses.map((business, index) => (
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4" key={business.business_id}>
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary-text">{index + 1}</span>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm">{business.business_name}</strong>
                      <small className="text-xs text-muted-foreground">
                        {business.completed_orders} completed order{business.completed_orders === 1 ? "" : "s"}
                      </small>
                    </div>
                    <strong className="text-sm">{money(business.completed_value)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-5">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Operations</span>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">Manage marketplace</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["/admin/users", "Users", "Roles and account status", Users],
                ["/admin/seller-applications", "Seller applications", "Review marketplace access", Store],
                ["/admin/businesses", "Businesses", "Storefront status and owners", Building2],
                ["/admin/products", "Products", "Listings, stock and moderation", ShoppingBag],
                ["/admin/orders", "Orders", "Marketplace fulfilment view", Package],
                ["/admin/reports", "Reports", "Moderation queue", FileWarning],
                ["/admin/marketplace", "Featured listings", "Homepage marketplace curation", TrendingUp],
                ["/admin/reference-data", "Reference data", "Universities and categories", ClipboardCheck]
              ].map(([to, title, description, Icon]) => (
                <Link
                  key={String(to)}
                  className="group rounded-2xl border border-border bg-card text-foreground p-4 shadow-sm transition hover:shadow-sm"
                  to={String(to)}
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary-text">
                    <Icon className="size-4" />
                  </span>
                  <strong className="mt-3 block text-sm">{String(title)}</strong>
                  <small className="mt-1 block text-xs leading-5 text-muted-foreground">{String(description)}</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Business mix</span>
              <strong className="mt-2 block text-2xl">{data.metrics.studentBusinesses}</strong>
              <small className="text-xs text-muted-foreground">Student businesses</small>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Business mix</span>
              <strong className="mt-2 block text-2xl">{data.metrics.otherBusinesses}</strong>
              <small className="text-xs text-muted-foreground">Other businesses</small>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">30-day value</span>
              <strong className="mt-2 block text-2xl">{money(data.metrics.orderValueLast30Days)}</strong>
              <small className="text-xs text-muted-foreground">Order value, not captured payments</small>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
