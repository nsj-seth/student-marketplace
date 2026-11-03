import { useEffect, useState } from "react";
import { ArrowRight, Heart, Package, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AccountNav } from "../../components/account/AccountNav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../services/cart.service";
import {
  getWishlist,
  removeFromWishlist,
  type WishlistItem
} from "../../services/wishlist.service";

function imageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function primaryImage(item: WishlistItem) {
  return item.product.images.find((image) => image.is_primary) ?? item.product.images[0] ?? null;
}

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await getWishlist();
      setItems(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(productId: string) {
    setBusyProductId(productId);
    setError("");
    setNotice("");

    try {
      await removeFromWishlist(productId);
      setItems((current) => current.filter((item) => item.product_id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove product from wishlist.");
    } finally {
      setBusyProductId(null);
    }
  }

  async function add(productId: string) {
    setBusyProductId(productId);
    setError("");
    setNotice("");

    try {
      await addToCart(productId, 1);
      setNotice("Added to cart.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add product to cart.");
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Heart className="size-3.5" />
              Saved for later
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.04em]">Your wishlist</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep products you’re considering in one place and move them to your cart when you’re ready.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white/75 px-5 py-4 text-center shadow-sm">
            <strong className="block text-2xl">{items.length}</strong>
            <span className="text-xs text-muted-foreground">saved item{items.length === 1 ? "" : "s"}</span>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />

          <section className="min-w-0">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            {loading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="aspect-[4/3] animate-pulse bg-muted" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary shadow-sm">
                  <Heart className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">No saved products yet</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Save products while you browse so you can compare and come back to them later.
                </p>
                <Link className={cn(buttonVariants(), "mt-5")} to="/products">
                  Discover products
                </Link>
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => {
                  const image = primaryImage(item);
                  const url = image ? imageUrl(image.storage_path) : null;
                  const product = item.product;
                  const unavailable =
                    product.status === "OUT_OF_STOCK" || product.stock_quantity <= 0;

                  return (
                    <article
                      className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
                      key={item.id}
                    >
                      <Link
                        className="relative block aspect-[4/3] overflow-hidden bg-muted"
                        to={`/products/${product.id}/${product.slug}`}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={image?.alt_text ?? product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground">
                            <Package className="size-8" />
                          </div>
                        )}

                        <div className="absolute left-3 top-3">
                          <Badge variant={unavailable ? "secondary" : "success"}>
                            {unavailable ? "Out of stock" : "In stock"}
                          </Badge>
                        </div>
                      </Link>

                      <div className="p-4">
                        <p className="m-0 text-xs font-semibold text-primary">
                          {product.category?.name ?? "Product"}
                        </p>
                        <Link
                          className="mt-1 line-clamp-2 block text-base font-semibold text-foreground hover:text-primary"
                          to={`/products/${product.id}/${product.slug}`}
                        >
                          {product.name}
                        </Link>
                        <p className="mt-3 text-lg font-bold">GH₵{product.price.toFixed(2)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          by{" "}
                          <Link className="font-semibold hover:text-primary" to={`/businesses/${product.business.slug}`}>
                            {product.business.name}
                          </Link>
                        </p>

                        <div className="mt-4 flex gap-2">
                          <button
                            data-ui="wishlist-add-cart"
                            type="button"
                            disabled={unavailable || busyProductId === product.id}
                            onClick={() => void add(product.id)}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                          >
                            <ShoppingCart className="size-4" />
                            {busyProductId === product.id ? "Working…" : unavailable ? "Unavailable" : "Add to cart"}
                          </button>

                          <button
                            data-ui="wishlist-remove"
                            type="button"
                            aria-label={`Remove ${product.name} from wishlist`}
                            disabled={busyProductId === product.id}
                            onClick={() => void remove(product.id)}
                            className="grid size-10 place-items-center rounded-xl border border-border bg-background text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <Link className="text-sm font-semibold text-primary" to="/products">Keep browsing products</Link>
                <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/cart">
                  Go to cart <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
