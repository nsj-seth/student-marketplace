import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Store
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
    const active = orders.filter((order) =>
      ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(order.status)
    ).length;
    const completed = orders.filter((order) => order.status === "COMPLETED");
    const completedValue = completed.reduce((sum, order) => sum + order.subtotal, 0);
    return { pending, active, completed: completed.length, completedValue };
  }, [orders]);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-muted" />
            <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <section className="pb-3 pt-2">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge variant="secondary" className="mb-4 rounded-lg">
              Seller Hub
            </Badge>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-.025em] sm:text-4xl">
              Your business, at a glance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Track stores, orders and fulfilment while keeping the customer marketplace only one click away.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to="/seller/businesses"
            >
              <Building2 className="size-4" />
              Manage businesses
            </Link>
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground"
              to="/sell"
            >
              Seller applications
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Seller overview">
        <article className="rounded-2xl border border-primary bg-primary p-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-white">Businesses</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
              <Store className="size-5" />
            </span>
          </div>
          <strong className="mt-5 block break-words text-2xl font-semibold tracking-tight">{businesses.length}</strong>
          <small className="mt-4 block text-sm text-white">
            {businesses.filter((business) => business.availability_status === "OPEN").length} currently open
          </small>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">New orders</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning-foreground">
              <Clock3 className="size-5" />
            </span>
          </div>
          <strong className="mt-5 block break-words text-2xl font-semibold tracking-tight">{metrics.pending}</strong>
          <small className="mt-4 block text-sm text-muted-foreground">Waiting for your response</small>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">In progress</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-info-soft text-info-foreground">
              <ShoppingBag className="size-5" />
            </span>
          </div>
          <strong className="mt-5 block break-words text-2xl font-semibold tracking-tight">{metrics.active}</strong>
          <small className="mt-4 block text-sm text-muted-foreground">Accepted or being fulfilled</small>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">Completed value</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success-soft text-success-foreground">
              <PackageCheck className="size-5" />
            </span>
          </div>
          <strong className="mt-5 block break-words text-2xl font-semibold tracking-tight">{money(metrics.completedValue)}</strong>
          <small className="mt-4 block text-sm text-muted-foreground">{metrics.completed} completed orders</small>
        </article>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Businesses</span>
              <h2 className="mt-1 text-lg font-semibold">Your stores</h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text" to="/seller/businesses">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="p-6 text-center">
              <Building2 className="mx-auto size-7 text-primary-text" />
              <h3 className="mt-3 text-base font-semibold">No approved businesses yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start or continue a seller application to create your first storefront.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {businesses.slice(0, 4).map((business) => (
                <article className="flex items-center justify-between gap-3 p-4" key={business.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary-text">
                      {business.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm">{business.name}</strong>
                      <small className="block truncate text-xs text-muted-foreground">{business.location_text}</small>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={business.availability_status === "OPEN" ? "success" : "secondary"}>
                      {business.availability_status === "OPEN" ? "Open" : "Unavailable"}
                    </Badge>
                    <Link className="text-sm font-semibold text-primary-text" to={"/seller/businesses/" + business.id}>
                      Manage
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Orders</span>
              <h2 className="mt-1 text-lg font-semibold">Recent activity</h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text" to="/seller/orders">
              View orders <ArrowRight className="size-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="mx-auto size-7 text-primary-text" />
              <h3 className="mt-3 text-base font-semibold">No orders yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">New customer orders will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  className="flex items-center justify-between gap-3 p-4 transition hover:bg-muted/40"
                  to={"/seller/orders/" + order.id}
                  key={order.id}
                >
                  <div className="min-w-0">
                    <strong className="block text-sm">{order.seller_order_number}</strong>
                    <small className="block truncate text-xs text-muted-foreground">
                      {order.business_name} · {order.customer_full_name}
                    </small>
                  </div>
                  <div className="text-right">
                    <strong className="block text-sm">{money(order.subtotal)}</strong>
                    <Badge variant="outline" className="mt-1">{order.status.replaceAll("_", " ")}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
