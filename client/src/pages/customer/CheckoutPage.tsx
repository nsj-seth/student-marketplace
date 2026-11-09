import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserRound
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  createOrder,
  getCheckoutPreview,
  type CheckoutPreview,
  type CreatedOrderSummary,
  type FulfilmentMethod
} from "../../services/checkout.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;

export function CheckoutPage() {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderSummary | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [selections, setSelections] = useState<Record<string, FulfilmentMethod | "">>({});

  useEffect(() => {
    void getCheckoutPreview()
      .then((response) => {
        const data = response.data ?? null;
        setPreview(data);
        if (!data) return;

        setFullName(data.customer.full_name ?? "");
        setSelections(
          Object.fromEntries(
            data.groups.map((group) => [
              group.business.id,
              group.available_fulfilment_methods.length === 1
                ? group.available_fulfilment_methods[0]
                : ""
            ])
          )
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to prepare checkout.");
      })
      .finally(() => setLoading(false));
  }, []);

  const allSelected = useMemo(
    () =>
      preview
        ? preview.groups.every((group) => Boolean(selections[group.business.id]))
        : false,
    [preview, selections]
  );

  const detailsReady =
    fullName.trim().length >= 2 &&
    phone.trim().length >= 7 &&
    location.trim().length >= 2;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!preview) return;

    setError("");
    setCreatedOrder(null);
    setSubmitting(true);

    try {
      const response = await createOrder({
        customerFullName: fullName,
        phone,
        location,
        note,
        fulfilmentSelections: preview.groups.map((group) => ({
          businessId: group.business.id,
          method: selections[group.business.id] as FulfilmentMethod
        }))
      });

      if (!response.data) {
        throw new Error("Order was created but no confirmation was returned.");
      }

      setCreatedOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-6 w-[min(1240px,calc(100%-32px))]">
          <div className="h-10 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="h-80 animate-pulse rounded-2xl bg-muted" />
              <div className="h-72 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (!preview) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 grid w-[min(720px,calc(100%-32px))] place-items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <ShoppingCart className="size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Checkout isn’t ready</h1>
          {error && <p className="mt-2 text-sm text-danger-foreground">{error}</p>}
          <Link
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            to="/cart"
          >
            <ArrowLeft className="size-4" />
            Back to cart
          </Link>
        </section>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(760px,calc(100%-32px))] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 px-6 py-10 text-center text-white sm:px-10">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <CheckCircle2 className="size-8" />
            </span>
            <span className="mt-5 block text-xs font-bold uppercase tracking-[.1em] text-emerald-100">
              Order placed
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.025em]">
              Your order is in.
            </h1>
            <p className="mt-3 text-sm text-emerald-50">
              Each seller can now process their part of the order independently.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-2xl bg-muted/50 p-5 text-center">
              <span className="text-xs font-medium text-muted-foreground">Order number</span>
              <strong className="mt-1 block text-xl">{createdOrder.orderNumber}</strong>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4">
                <span className="text-xs text-muted-foreground">Total</span>
                <strong className="mt-1 block">{money(createdOrder.total)}</strong>
              </div>
              <div className="rounded-xl border border-border p-4">
                <span className="text-xs text-muted-foreground">Seller orders</span>
                <strong className="mt-1 block">{createdOrder.sellerOrderCount}</strong>
              </div>
              <div className="rounded-xl border border-border p-4">
                <span className="text-xs text-muted-foreground">Status</span>
                <strong className="mt-1 block">{createdOrder.status}</strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                to={`/orders/${createdOrder.orderId}`}
              >
                <PackageCheck className="size-4" />
                Track this order
              </Link>
              <Link
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
                to="/orders"
              >
                All orders
              </Link>
            </div>

            <Link
              className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-primary-text"
              to="/products"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1240px,calc(100%-32px))]">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <ClipboardCheck className="size-3.5" />
              Checkout
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.025em] sm:text-4xl">
              Complete your order
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Confirm your details and choose how each seller should fulfil their part.
            </p>
          </div>

          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/cart">
            <ArrowLeft className="size-4" />
            Back to cart
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Cart", true],
            ["2", "Details & fulfilment", true],
            ["3", "Order placed", false]
          ].map(([step, label, active]) => (
            <div
              key={String(step)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                active ? "border-primary/20 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg text-sm font-bold ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </span>
              <strong className="text-sm">{label}</strong>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            {error}
          </div>
        )}

        <form
          className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
          onSubmit={submit}
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Your details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These details are attached to each seller-specific order.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Full name
                  <Input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Your full name"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Email
                  <Input value={preview.customer.email} disabled />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Phone number
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    minLength={7}
                    maxLength={30}
                    placeholder="e.g. 024 000 0000"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Delivery / pickup location
                  <textarea
                    data-ui="checkout-textarea"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    required
                    minLength={2}
                    maxLength={300}
                    placeholder="Hostel, hall, landmark, neighbourhood or pickup instructions"
                    className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Order note <span className="font-normal">Optional</span>
                  <textarea
                    data-ui="checkout-textarea"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                    placeholder="Anything useful for the sellers to know"
                    className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <Truck className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Fulfilment by seller</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose pickup or delivery separately for each seller.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {preview.groups.map((group) => (
                  <article
                    className="rounded-2xl border border-border bg-background p-4"
                    key={group.business.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Store className="size-4 text-primary-text" />
                          <h3 className="text-base font-semibold">{group.business.name}</h3>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {group.business.location_text}
                        </p>
                      </div>
                      <strong>{money(group.subtotal)}</strong>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <Badge variant="outline" key={item.id}>
                          {item.quantity}× {item.product.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {group.available_fulfilment_methods.includes("PICKUP") && (
                        <label
                          className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                            selections[group.business.id] === "PICKUP"
                              ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`fulfilment-${group.business.id}`}
                            value="PICKUP"
                            checked={selections[group.business.id] === "PICKUP"}
                            onChange={() =>
                              setSelections((current) => ({
                                ...current,
                                [group.business.id]: "PICKUP"
                              }))
                            }
                            className="mt-1 accent-violet-600"
                          />
                          <span>
                            <strong className="block text-sm">Customer pickup</strong>
                            <small className="mt-1 block leading-5 text-muted-foreground">
                              Collect directly from the seller.
                            </small>
                          </span>
                        </label>
                      )}

                      {group.available_fulfilment_methods.includes("SELLER_DELIVERY") && (
                        <label
                          className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                            selections[group.business.id] === "SELLER_DELIVERY"
                              ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`fulfilment-${group.business.id}`}
                            value="SELLER_DELIVERY"
                            checked={selections[group.business.id] === "SELLER_DELIVERY"}
                            onChange={() =>
                              setSelections((current) => ({
                                ...current,
                                [group.business.id]: "SELLER_DELIVERY"
                              }))
                            }
                            className="mt-1 accent-violet-600"
                          />
                          <span>
                            <strong className="flex items-center gap-1.5 text-sm">
                              <Truck className="size-4" />
                              Seller delivery
                            </strong>
                            <small className="mt-1 block leading-5 text-muted-foreground">
                              The seller arranges delivery with you.
                            </small>
                          </span>
                        </label>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-[92px] lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">
                Order summary
              </span>
              <h2 className="mt-2 text-xl font-semibold">
                {preview.total_quantity} item{preview.total_quantity === 1 ? "" : "s"}
              </h2>

              <div className="mt-5 space-y-3 border-b border-border pb-5">
                {preview.groups.map((group) => (
                  <div className="flex items-center justify-between gap-3 text-sm" key={group.business.id}>
                    <span className="truncate text-muted-foreground">{group.business.name}</span>
                    <strong className="shrink-0">{money(group.subtotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Product types</span>
                  <strong>{preview.item_count}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sellers</span>
                  <strong>{preview.groups.length}</strong>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <strong className="text-2xl tracking-tight">{money(preview.total)}</strong>
              </div>

              {!allSelected && (
                <p className="mt-4 rounded-xl bg-warning-soft px-3 py-2 text-xs leading-5 text-warning-foreground">
                  Choose a fulfilment method for every seller.
                </p>
              )}

              {!detailsReady && (
                <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs leading-5 text-warning-foreground">
                  Complete your name, phone and location.
                </p>
              )}

              <button
                data-ui="checkout-submit"
                type="submit"
                disabled={submitting || !allSelected || !detailsReady}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:saturate-50"
              >
                <PackageCheck className="size-4" />
                {submitting ? "Placing order…" : "Place order"}
              </button>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                No payment is collected in this MVP. Prices, availability and stock are revalidated when the order is placed.
              </p>

              <div className="mt-4 flex gap-3 rounded-xl bg-muted/50 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                <p className="m-0 text-xs leading-5 text-muted-foreground">
                  Your cart becomes an order only after all server-side checks succeed.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
