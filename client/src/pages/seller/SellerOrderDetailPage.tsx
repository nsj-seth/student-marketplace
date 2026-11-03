import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  Store,
  Truck,
  UserRound,
  XCircle
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  getSellerOrder,
  updateSellerOrderStatus,
  type SellerOrderDetail
} from "../../services/seller-order.service";
import type { SellerOrderStatus } from "../../services/order.service";

const money = (value: number) => "GH₵" + value.toFixed(2);
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

function nextAction(
  order: SellerOrderDetail
): { status: SellerOrderStatus; label: string } | null {
  if (order.status === "PENDING") {
    return { status: "ACCEPTED", label: "Accept order" };
  }
  if (order.status === "ACCEPTED") {
    return { status: "PREPARING", label: "Start preparing" };
  }
  if (order.status === "PREPARING") {
    return order.fulfilment_method === "PICKUP"
      ? { status: "READY", label: "Mark ready for pickup" }
      : { status: "OUT_FOR_DELIVERY", label: "Mark out for delivery" };
  }
  if (
    order.status === "READY" ||
    order.status === "OUT_FOR_DELIVERY"
  ) {
    return { status: "COMPLETED", label: "Mark completed" };
  }
  return null;
}

export function SellerOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const action = useMemo(() => (order ? nextAction(order) : null), [order]);

  function load() {
    if (!id) return;

    setLoading(true);
    void getSellerOrder(id)
      .then((response) => setOrder(response.data ?? null))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load seller order."
        )
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function transition(status: SellerOrderStatus, note?: string) {
    if (!id) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateSellerOrderStatus(id, status, note);
      setOrder(response.data ?? null);
      setSuccess("Order updated to " + label(status) + ".");
      if (status === "REJECTED") setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <div className="space-y-5">
          <div className="h-36 animate-pulse rounded-3xl bg-muted" />
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <PackageCheck className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Seller order unavailable</h1>
          <p className="mt-2 text-sm text-red-600">
            {error || "Order not found."}
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to="/seller/orders"
          >
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to="/seller/orders"
          >
            <ArrowLeft className="size-4" />
            Seller orders
          </Link>
          <span className="block text-xs font-semibold text-primary">
            {order.business_name}
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-[-.04em]">
            {order.seller_order_number}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Parent order: {order.parent_order_number}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge variant="outline">{label(order.status)}</Badge>
          <strong className="text-2xl">{money(order.subtotal)}</strong>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Customer details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact and fulfilment information for this seller order.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground">Customer</span>
                <strong className="mt-1 block text-sm">
                  {order.customer.full_name}
                </strong>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="size-3.5" />
                  Phone
                </span>
                <strong className="mt-1 block text-sm">
                  {order.customer.phone}
                </strong>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  Location
                </span>
                <strong className="mt-1 block text-sm">
                  {order.customer.location}
                </strong>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
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
            </div>

            {order.customer.note && (
              <div className="mt-4 rounded-xl border border-border bg-background p-4">
                <strong className="text-sm">Customer note</strong>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.customer.note}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Items</h2>

            <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {order.items.map((item) => (
                <div
                  className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  key={item.id}
                >
                  <div>
                    <strong className="block text-sm">
                      {item.product_name}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {money(item.unit_price)} each
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    × {item.quantity}
                  </span>
                  <strong className="text-sm">
                    {money(item.subtotal)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <strong className="text-xl">{money(order.subtotal)}</strong>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Order timeline</h2>
            </div>

            {order.timeline.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No timeline events yet.
              </p>
            ) : (
              <div className="mt-5">
                {order.timeline.map((entry, index) => (
                  <div className="relative flex gap-3 pb-5" key={entry.id}>
                    <div className="relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="size-4" />
                    </div>
                    {index < order.timeline.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
                    )}
                    <div>
                      <strong className="block text-sm">
                        {label(entry.status)}
                      </strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {dateTime(entry.created_at)}
                      </span>
                      {entry.note && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="xl:sticky xl:top-[92px] xl:self-start">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-[.14em] text-primary">
              Update order
            </span>
            <h2 className="mt-2 text-xl font-semibold">
              Next action
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Advance this order according to its current operational state.
            </p>

            {action && (
              <button
                data-ui="seller-order-transition"
                type="button"
                disabled={busy}
                onClick={() => void transition(action.status)}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                <PackageCheck className="size-4" />
                {busy ? "Updating..." : action.label}
              </button>
            )}

            {order.status === "PENDING" && (
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-600" />
                  <strong className="text-sm">Reject order</strong>
                </div>
                <label className="mt-3 grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Rejection reason
                  <textarea
                    data-ui="seller-reject-reason"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Explain why the order cannot be accepted."
                    className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                  />
                </label>
                <button
                  data-ui="seller-order-reject"
                  type="button"
                  disabled={busy || rejectReason.trim().length < 3}
                  onClick={() =>
                    void transition("REJECTED", rejectReason)
                  }
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Reject order
                </button>
              </div>
            )}

            {!action && order.status !== "PENDING" && (
              <div className="mt-5 rounded-xl bg-muted/50 p-4">
                <strong className="text-sm">
                  No further actions available
                </strong>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  This order is in a terminal state and cannot be advanced further.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
