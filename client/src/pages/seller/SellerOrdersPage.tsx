import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  Filter,
  PackageCheck,
  Store,
  Truck
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  getMyBusinesses,
  type ManagedBusiness
} from "../../services/business.service";
import {
  getSellerOrders,
  type SellerOrderGroup,
  type SellerOrderListItem
} from "../../services/seller-order.service";

const money = (value: number) => "GH₵" + value.toFixed(2);
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

const groups: Array<{ value: SellerOrderGroup; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected / Cancelled" },
  { value: "all", label: "All" }
];

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function SellerOrdersPage() {
  const [params, setParams] = useSearchParams();
  const group = (params.get("group") as SellerOrderGroup | null) ?? "pending";
  const businessId = params.get("businessId") ?? "";
  const [orders, setOrders] = useState<SellerOrderListItem[]>([]);
  const [businesses, setBusinesses] = useState<ManagedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void getMyBusinesses()
      .then((response) => setBusinesses(response.data ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    void getSellerOrders({ group, businessId: businessId || undefined })
      .then((response) => setOrders(response.data ?? []))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load seller orders."
        )
      )
      .finally(() => setLoading(false));
  }, [group, businessId]);

  function updateFilter(key: "group" | "businessId", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <ClipboardList className="size-3.5" />
            Seller Hub · Fulfilment
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.04em]">
            Orders
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review new orders, track active fulfilment and manage each seller order independently.
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          to="/seller/businesses"
        >
          My businesses <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Business
          <select
            className={selectClass}
            value={businessId}
            onChange={(event) =>
              updateFilter("businessId", event.target.value)
            }
          >
            <option value="">All businesses</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Order group
          <select
            className={selectClass}
            value={group}
            onChange={(event) => updateFilter("group", event.target.value)}
          >
            {groups.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
          <Filter className="size-7 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">
            No orders in this view
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Orders will appear here when customers place them.
          </p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="mt-5 space-y-4">
          {orders.map((order) => (
            <article
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              key={order.id}
            >
              <div className="flex flex-col gap-4 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-xs font-semibold text-primary">
                    {order.business_name}
                  </span>
                  <h2 className="mt-1 text-lg font-semibold">
                    {order.seller_order_number}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Parent: {order.parent_order_number}
                  </p>
                </div>
                <Badge variant="outline">
                  {label(order.status)}
                </Badge>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">
                    Customer
                  </span>
                  <strong className="mt-1 block text-sm">
                    {order.customer_full_name}
                  </strong>
                </div>

                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {order.fulfilment_method === "PICKUP" ? (
                      <Store className="size-3.5" />
                    ) : (
                      <Truck className="size-3.5" />
                    )}
                    Fulfilment
                  </span>
                  <strong className="mt-1 block text-sm">
                    {order.fulfilment_method === "PICKUP"
                      ? "Customer Pickup"
                      : "Seller Delivery"}
                  </strong>
                </div>

                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    Placed
                  </span>
                  <strong className="mt-1 block text-sm">
                    {dateTime(order.created_at)}
                  </strong>
                </div>

                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">
                    Subtotal
                  </span>
                  <strong className="mt-1 block text-sm">
                    {money(order.subtotal)}
                  </strong>
                </div>
              </div>

              <div className="flex justify-end border-t border-border bg-muted/20 p-4">
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  to={"/seller/orders/" + order.id}
                >
                  <PackageCheck className="size-4" />
                  Manage order
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
