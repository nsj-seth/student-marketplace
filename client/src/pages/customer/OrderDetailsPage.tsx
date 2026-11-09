import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
  UserRound,
  XCircle
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AccountNav } from "../../components/account/AccountNav";
import { OrderReviewPanel } from "../../components/reviews/OrderReviewPanel";
import { Badge } from "@/components/ui/badge";
import {
  getMyOrder,
  type CustomerOrderDetail,
  type SellerOrderStatus
} from "../../services/order.service";

const money = (value: number) => "GH₵" + value.toFixed(2);
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

function timelineLabel(
  status: SellerOrderStatus,
  fulfilment: "PICKUP" | "SELLER_DELIVERY"
) {
  switch (status) {
    case "PENDING":
      return "Order sent to seller";
    case "ACCEPTED":
      return "Seller accepted your order";
    case "PREPARING":
      return "Seller is preparing your order";
    case "READY":
      return "Ready for pickup";
    case "OUT_FOR_DELIVERY":
      return "Out for delivery";
    case "COMPLETED":
      return "Order completed";
    case "REJECTED":
      return "Seller could not fulfil this order";
    case "CANCELLED":
      return "Order cancelled";
    default:
      return fulfilment === "PICKUP" ? "Pickup order update" : "Delivery order update";
  }
}

export function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    void getMyOrder(id)
      .then((response) => setOrder(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-6 w-[min(1100px,calc(100%-32px))]">
          <div className="h-36 animate-pulse rounded-2xl bg-muted" />
          <div className="mt-6 h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(760px,calc(100%-32px))] rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Package className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Order unavailable</h1>
          <p className="mt-2 text-sm text-danger-foreground">{error || "Order not found."}</p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/orders">
            <ArrowLeft className="size-4" />
            Back to My Orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/orders">
              <ArrowLeft className="size-4" />
              My orders
            </Link>
            <span className="block text-xs font-medium text-muted-foreground">
              Placed {dateTime(order.created_at)}
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.025em]">{order.order_number}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{order.status_summary}</p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge variant="secondary">{label(order.display_status)}</Badge>
            <strong className="text-2xl">{money(order.total)}</strong>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />

          <section className="min-w-0 space-y-6">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs text-muted-foreground">Seller orders</span>
                <strong className="mt-1 block text-2xl">{order.seller_order_count}</strong>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" /> Active
                </span>
                <strong className="mt-1 block text-2xl">{order.active_count}</strong>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5" /> Completed
                </span>
                <strong className="mt-1 block text-2xl">{order.completed_count}</strong>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <XCircle className="size-3.5" /> Not fulfilled
                </span>
                <strong className="mt-1 block text-2xl">{order.rejected_count}</strong>
              </div>
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Customer information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Delivery and contact details attached to this order.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <strong className="mt-1 block">{order.customer_full_name}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3.5" /> Phone
                  </span>
                  <strong className="mt-1 block">{order.customer_phone}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> Location
                  </span>
                  <strong className="mt-1 block">{order.customer_location}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <strong className="mt-1 block">{money(order.total)}</strong>
                </div>
              </div>

              {order.customer_note && (
                <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
                  <strong>Order note</strong>
                  <p className="mt-1 text-muted-foreground">{order.customer_note}</p>
                </div>
              )}
            </section>

            <div className="space-y-5">
              {order.seller_orders.map((sellerOrder) => (
                <section
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  key={sellerOrder.id}
                >
                  <div className="flex flex-col gap-4 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary-text">
                        {sellerOrder.business_name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">{sellerOrder.seller_order_number}</span>
                        <h2 className="mt-1 text-lg font-semibold">{sellerOrder.business_name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{sellerOrder.progress_label}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{label(sellerOrder.status)}</Badge>
                  </div>

                  <div className="p-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Order progress</span>
                        <strong>{sellerOrder.progress_percent}%</strong>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: String(sellerOrder.progress_percent) + "%" }}
                        />
                      </div>
                    </div>

                    {sellerOrder.rejection_reason && (
                      <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft p-4">
                        <strong className="text-sm text-danger-foreground">Why this seller order was not fulfilled</strong>
                        <p className="mt-1 text-sm text-danger-foreground">{sellerOrder.rejection_reason}</p>
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/50 p-4">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {sellerOrder.fulfilment_method === "PICKUP" ? (
                            <Store className="size-3.5" />
                          ) : (
                            <Truck className="size-3.5" />
                          )}
                          Fulfilment
                        </span>
                        <strong className="mt-1 block text-sm">
                          {sellerOrder.fulfilment_method === "PICKUP" ? "Customer Pickup" : "Seller Delivery"}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-4">
                        <span className="text-xs text-muted-foreground">Subtotal</span>
                        <strong className="mt-1 block text-sm">{money(sellerOrder.subtotal)}</strong>
                      </div>
                    </div>

                    <div className="mt-5 divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {sellerOrder.items.map((item) => (
                        <div className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={item.id}>
                          <div>
                            <strong className="block text-sm">{item.product_name}</strong>
                            <span className="text-xs text-muted-foreground">{money(item.unit_price)} each</span>
                          </div>
                          <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                          <strong className="text-sm">{money(item.subtotal)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-semibold">Tracking timeline</h3>

                      {sellerOrder.timeline.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">No tracking events yet.</p>
                      ) : (
                        <div className="mt-4 space-y-0">
                          {sellerOrder.timeline.map((entry, index) => (
                            <div className="relative flex gap-3 pb-5" key={entry.id}>
                              <div className="relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-text">
                                <CheckCircle2 className="size-4" />
                              </div>
                              {index < sellerOrder.timeline.length - 1 && (
                                <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
                              )}
                              <div>
                                <strong className="block text-sm">
                                  {timelineLabel(entry.status, sellerOrder.fulfilment_method)}
                                </strong>
                                <span className="mt-1 block text-xs text-muted-foreground">{dateTime(entry.created_at)}</span>
                                {entry.note && <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <OrderReviewPanel orderId={order.id} />
          </section>
        </div>
      </div>
    </main>
  );
}
