import { useEffect, useState } from "react";
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";
import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartQuantity,
  type Cart
} from "../../services/cart.service";

function imageUrl(path: string) {
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");

    try {
      const response = await getCart();
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;

    setBusyItem(itemId);
    setError("");

    try {
      const response = await updateCartQuantity(itemId, quantity);
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update cart.");
    } finally {
      setBusyItem(null);
    }
  }

  async function remove(itemId: string) {
    setBusyItem(itemId);
    setError("");

    try {
      const response = await removeCartItem(itemId);
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove cart item.");
    } finally {
      setBusyItem(null);
    }
  }

  async function clear() {
    setClearing(true);
    setError("");

    try {
      const response = await clearCart();
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear cart.");
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-6 w-[min(1240px,calc(100%-32px))]">
          <div className="h-10 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1240px,calc(100%-32px))]">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <ShoppingBag className="size-3.5" />
              Shopping bag
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.04em] sm:text-4xl">Your cart</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {isEmpty
                ? "Your next favourite find can start here."
                : `${cart.item_count} product type${cart.item_count === 1 ? "" : "s"} · ${cart.total_quantity} item${cart.total_quantity === 1 ? "" : "s"}`}
            </p>
          </div>

          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/products">
            Continue shopping <ArrowRight className="size-4" />
          </Link>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isEmpty ? (
          <section className="mt-8 grid place-items-center rounded-[1.75rem] border border-dashed border-border bg-muted/25 px-6 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-card text-primary shadow-sm">
              <ShoppingBag className="size-7" />
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-.03em]">Your cart is waiting for something good.</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Browse products from student and community sellers, then add what you want to buy.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link className={buttonVariants()} to="/products">Explore products</Link>
              <Link className={buttonVariants({ variant: "outline" })} to="/businesses">Browse stores</Link>
            </div>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              {cart.groups.map((group) => (
                <section
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  key={group.business.id}
                >
                  <header className="flex flex-col gap-3 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Store className="size-5" />
                      </span>
                      <div>
                        <Link
                          to={`/businesses/${group.business.slug}`}
                          className="text-base font-semibold text-foreground hover:text-primary"
                        >
                          {group.business.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={group.business.availability_status === "OPEN" ? "success" : "secondary"}>
                            {group.business.availability_status === "OPEN" ? "Open" : "Unavailable"}
                          </Badge>
                          {group.business.seller_delivery_enabled && (
                            <span className="flex items-center gap-1"><Truck className="size-3.5" /> Delivery available</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <strong className="text-lg">{money(group.subtotal)}</strong>
                  </header>

                  <div className="divide-y divide-border">
                    {group.items.map((item) => {
                      const image =
                        item.product.images.find((entry) => entry.is_primary) ??
                        item.product.images[0] ??
                        null;

                      return (
                        <article
                          className="grid gap-4 p-4 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center"
                          key={item.id}
                        >
                          <Link
                            className="overflow-hidden rounded-xl border border-border bg-muted"
                            to={`/products/${item.product.id}/${item.product.slug}`}
                          >
                            {image ? (
                              <img
                                src={imageUrl(image.storage_path)}
                                alt={item.product.name}
                                className="aspect-square h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid aspect-square place-items-center text-muted-foreground">
                                <Package className="size-6" />
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0">
                            <p className="m-0 text-xs font-semibold text-primary">
                              {item.product.category?.name ?? "Product"}
                            </p>
                            <Link
                              to={`/products/${item.product.id}/${item.product.slug}`}
                              className="mt-1 line-clamp-2 block text-sm font-semibold text-foreground hover:text-primary"
                            >
                              {item.product.name}
                            </Link>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {money(item.product.price)} each · {item.product.stock_quantity} available
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <div
                                className="inline-flex items-center overflow-hidden rounded-xl border border-border bg-background"
                                aria-label={`Quantity for ${item.product.name}`}
                              >
                                <button
                                  data-ui="cart-quantity"
                                  type="button"
                                  aria-label="Decrease quantity"
                                  disabled={busyItem === item.id || item.quantity <= 1}
                                  onClick={() => void changeQuantity(item.id, item.quantity - 1)}
                                  className="grid size-9 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                                >
                                  <Minus className="size-4" />
                                </button>
                                <span className="min-w-10 text-center text-sm font-semibold">{item.quantity}</span>
                                <button
                                  data-ui="cart-quantity"
                                  type="button"
                                  aria-label="Increase quantity"
                                  disabled={
                                    busyItem === item.id ||
                                    item.quantity >= item.product.stock_quantity
                                  }
                                  onClick={() => void changeQuantity(item.id, item.quantity + 1)}
                                  className="grid size-9 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                                >
                                  <Plus className="size-4" />
                                </button>
                              </div>

                              <button
                                data-ui="cart-remove"
                                type="button"
                                disabled={busyItem === item.id}
                                onClick={() => void remove(item.id)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                              >
                                <Trash2 className="size-3.5" />
                                {busyItem === item.id ? "Updating…" : "Remove"}
                              </button>
                            </div>
                          </div>

                          <strong className="text-base sm:text-right">{money(item.subtotal)}</strong>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <aside className="lg:sticky lg:top-[92px] lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-[.14em] text-primary">Order summary</span>
                <h2 className="mt-2 text-xl font-semibold">Ready to check out?</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Product types</span>
                    <strong>{cart.item_count}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total items</span>
                    <strong>{cart.total_quantity}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sellers</span>
                    <strong>{cart.groups.length}</strong>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                  <strong className="text-2xl tracking-tight">{money(cart.total)}</strong>
                </div>

                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  You’ll choose pickup or seller delivery separately for each business at checkout.
                </p>

                <Link
                  className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}
                  to="/checkout"
                >
                  Continue to checkout
                  <ArrowRight className="size-4" />
                </Link>

                <button
                  data-ui="cart-clear"
                  type="button"
                  disabled={clearing}
                  onClick={() => void clear()}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  {clearing ? "Clearing…" : "Clear cart"}
                </button>

                <div className="mt-5 flex gap-3 rounded-xl bg-muted/50 p-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <p className="m-0 text-xs leading-5 text-muted-foreground">
                    Prices, stock and seller availability are rechecked before your order is created.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
