import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Package, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getAdminOrder, type AdminOrderDetail } from "../../services/admin-order.service";

function money(value: number) {
  return "GH₵" + value.toFixed(2);
}

function dateTime(value: string) {
  return new Date(value).toLocaleString();
}

export function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminOrder(id)
      .then((response) => setOrder(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Package className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Order unavailable</h1>
          <p className="mt-2 text-sm text-danger-foreground">{error || "Order not found."}</p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/admin/orders">
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/admin/orders">
          <ArrowLeft className="size-4" />
          Orders
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Admin order review</span>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.025em]">{order.order_number}</h1>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge variant="secondary">{order.display_status.replaceAll("_", " ")}</Badge>
            <strong className="text-2xl">{money(order.total)}</strong>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-primary-text" />
          <h2 className="text-lg font-semibold">Customer</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-3">
            <span className="text-xs text-muted-foreground">Name</span>
            <strong className="mt-1 block text-sm">{order.customer_name}</strong>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <span className="text-xs text-muted-foreground">Phone</span>
            <strong className="mt-1 block text-sm">{order.customer_phone}</strong>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <span className="text-xs text-muted-foreground">Location</span>
            <strong className="mt-1 block text-sm">{order.customer_location}</strong>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <span className="text-xs text-muted-foreground">Placed</span>
            <strong className="mt-1 block text-sm">{dateTime(order.created_at)}</strong>
          </div>
        </div>
        {order.customer_note && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            <strong>Customer note</strong>
            <p className="mt-1 text-muted-foreground">{order.customer_note}</p>
          </div>
        )}
      </section>

      <div className="mt-5 space-y-5">
        {order.seller_orders.map((sellerOrder) => (
          <section key={sellerOrder.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-semibold text-primary-text">{sellerOrder.seller_order_number}</span>
                <h2 className="mt-1 text-lg font-semibold">{sellerOrder.business_name}</h2>
              </div>
              <Badge variant="outline">{sellerOrder.status.replaceAll("_", " ")}</Badge>
            </div>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Fulfilment</span>
                  <strong className="mt-1 block text-sm">
                    {sellerOrder.fulfilment_method === "PICKUP" ? "Customer pickup" : "Seller delivery"}
                  </strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <strong className="mt-1 block text-sm">{money(sellerOrder.subtotal)}</strong>
                </div>
              </div>

              <h3 className="mt-5 text-sm font-semibold">Items</h3>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {sellerOrder.items.map((item) => (
                  <div className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={item.id}>
                    <strong className="text-sm">{item.product_name}</strong>
                    <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                    <strong className="text-sm">{money(item.subtotal)}</strong>
                  </div>
                ))}
              </div>

              <h3 className="mt-5 text-sm font-semibold">Timeline</h3>
              {sellerOrder.timeline.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No timeline entries.</p>
              ) : (
                <div className="mt-4">
                  {sellerOrder.timeline.map((entry, index) => (
                    <div className="relative flex gap-3 pb-5" key={entry.id}>
                      <div className="relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-text">
                        <CheckCircle2 className="size-4" />
                      </div>
                      {index < sellerOrder.timeline.length - 1 && (
                        <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
                      )}
                      <div>
                        <strong className="block text-sm">{entry.status.replaceAll("_", " ")}</strong>
                        <span className="mt-1 block text-xs text-muted-foreground">{dateTime(entry.created_at)}</span>
                        {entry.note && <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
