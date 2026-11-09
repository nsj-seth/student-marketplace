import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { AccountNav } from "../../components/account/AccountNav";
import { Badge } from "@/components/ui/badge";
import { getMyOrders, type CustomerOrderListItem } from "../../services/order.service";

const money = (value: number) => "GH₵" + value.toFixed(2);
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

export function MyOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    void getMyOrders()
      .then((response) => setOrders(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (filter === "ALL") return true;
        if (filter === "ACTIVE") return order.active_count > 0;
        return order.completed_count > 0 && order.active_count === 0;
      }),
    [orders, filter]
  );

  const active = orders.filter((order) => order.active_count > 0).length;
  const completed = orders.filter(
    (order) => order.completed_count > 0 && order.active_count === 0
  ).length;

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-gradient-to-br from-accent/60 via-card to-background p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Package className="size-3.5" />
              My purchases
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.04em]">Orders & tracking</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Follow each seller independently from acceptance to pickup or delivery.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            to="/products"
          >
            <ShoppingBag className="size-4" />
            Continue shopping
          </Link>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />

          <section className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs text-muted-foreground">Total orders</span>
                <strong className="mt-1 block text-2xl">{orders.length}</strong>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" /> In progress
                </span>
                <strong className="mt-1 block text-2xl">{active}</strong>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5" /> Completed
                </span>
                <strong className="mt-1 block text-2xl">{completed}</strong>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
              {(["ALL", "ACTIVE", "COMPLETED"] as const).map((value) => (
                <button
                  data-ui="orders-filter"
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={
                    "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                    (filter === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }
                >
                  {value === "ALL" ? "All" : value === "ACTIVE" ? "In progress" : "Completed"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
                {error}
              </div>
            )}

            {loading && (
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-52 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            )}

            {!loading && orders.length === 0 && (
              <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <Package className="size-7 text-primary-text" />
                <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your orders will appear here once you complete checkout.
                </p>
              </div>
            )}

            {!loading && orders.length > 0 && visibleOrders.length === 0 && (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/25 p-10 text-center">
                <h2 className="text-lg font-semibold">No orders in this view</h2>
                <p className="mt-2 text-sm text-muted-foreground">Try another status filter.</p>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {visibleOrders.map((order) => (
                <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" key={order.id}>
                  <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">{dateTime(order.created_at)}</span>
                      <h2 className="mt-1 text-lg font-semibold">{order.order_number}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{order.status_summary}</p>
                    </div>
                    <Badge variant="secondary">{label(order.display_status)}</Badge>
                  </div>

                  <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-4">
                    <span className="text-xs text-muted-foreground">
                      <strong className="block text-base text-foreground">{order.seller_order_count}</strong>
                      stores
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <strong className="block text-base text-foreground">{order.active_count}</strong>
                      active
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <strong className="block text-base text-foreground">{order.completed_count}</strong>
                      completed
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <strong className="block text-base text-foreground">{order.rejected_count}</strong>
                      not fulfilled
                    </span>
                  </div>

                  <div className="divide-y divide-border">
                    {order.businesses.map((business) => (
                      <div key={business.seller_order_number} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary-text">
                              {business.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <strong className="block truncate text-sm">{business.name}</strong>
                              <span className="text-xs text-muted-foreground">{business.seller_order_number}</span>
                            </div>
                          </div>
                          <Badge variant="outline">{label(business.status)}</Badge>
                        </div>

                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{business.progress_label}</span>
                            <strong>{business.progress_percent}%</strong>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: String(business.progress_percent) + "%" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Order total</span>
                      <strong className="block text-lg">{money(order.total)}</strong>
                    </div>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text"
                      to={"/orders/" + order.id}
                    >
                      Track order <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
