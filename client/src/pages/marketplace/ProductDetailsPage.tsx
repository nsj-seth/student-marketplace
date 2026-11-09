import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  Store,
  Truck
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PublicReviewsPanel } from "../../components/reviews/PublicReviewsPanel";
import { ReportForm } from "../../components/reports/ReportForm";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../services/cart.service";
import { getPublicProduct, type PublicProduct } from "../../services/product.service";
import {
  addToWishlist,
  getWishlistStatus,
  removeFromWishlist
} from "../../services/wishlist.service";

function imageUrl(path: string) {
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) return;

      try {
        const response = await getPublicProduct(id);
        const loaded = response.data ?? null;
        if (!active) return;

        setProduct(loaded);
        const primary = loaded?.images.find((image) => image.is_primary) ?? loaded?.images[0] ?? null;
        setSelectedImageId(primary?.id ?? null);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load product.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !user) {
      setWishlisted(false);
      return;
    }

    let active = true;

    void getWishlistStatus(id)
      .then((response) => {
        if (active) setWishlisted(Boolean(response.data?.wishlisted));
      })
      .catch(() => {
        if (active) setWishlisted(false);
      });

    return () => {
      active = false;
    };
  }, [id, user]);

  async function toggleWishlist() {
    if (!id || !user) return;

    setWishlistLoading(true);
    setWishlistError("");

    try {
      if (wishlisted) {
        await removeFromWishlist(id);
        setWishlisted(false);
      } else {
        await addToWishlist(id);
        setWishlisted(true);
      }
    } catch (err) {
      setWishlistError(err instanceof Error ? err.message : "Unable to update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!id || !user) return;

    setCartLoading(true);
    setCartMessage("");
    setCartError("");

    try {
      const response = await addToCart(id, 1);
      setCartMessage(`Added to cart. Cart now has ${response.data?.total_quantity ?? 1} item(s).`);
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "Unable to add to cart.");
    } finally {
      setCartLoading(false);
    }
  }

  const selectedImage = useMemo(
    () => product?.images.find((image) => image.id === selectedImageId) ?? product?.images[0] ?? null,
    [product, selectedImageId]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-6 grid w-[min(1240px,calc(100%-32px))] gap-6 lg:grid-cols-[1.08fr_.92fr]">
          <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-7 w-40 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(760px,calc(100%-32px))] rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Package className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Product unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "Product not found."}</p>
          <Link className={cn(buttonVariants({ variant: "outline" }), "mt-6")} to="/products">
            <ArrowLeft className="size-4" />
            Back to products
          </Link>
        </section>
      </main>
    );
  }

  const unavailable =
    product.status === "OUT_OF_STOCK" ||
    product.business.availability_status === "UNAVAILABLE";

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1240px,calc(100%-32px))]">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-primary-text" to="/">Home</Link>
          <span>/</span>
          <Link className="hover:text-primary-text" to="/products">Products</Link>
          <span>/</span>
          <span className="max-w-[280px] truncate text-foreground">{product.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-muted shadow-sm">
              {selectedImage ? (
                <img
                  className="aspect-square h-full w-full object-cover"
                  src={imageUrl(selectedImage.storage_path)}
                  alt={selectedImage.alt_text ?? product.name}
                />
              ) : (
                <div className="grid aspect-square place-items-center bg-gradient-to-br from-muted to-accent/60 text-muted-foreground">
                  <Package className="size-12" strokeWidth={1.4} />
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-6">
                {product.images.map((image) => (
                  <button
                    data-ui="product-thumbnail"
                    type="button"
                    key={image.id}
                    className={cn(
                      "overflow-hidden rounded-xl border-2 bg-muted transition",
                      image.id === selectedImage?.id
                        ? "border-primary ring-4 ring-primary/10"
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => setSelectedImageId(image.id)}
                  >
                    <img
                      src={imageUrl(image.storage_path)}
                      alt={image.alt_text ?? product.name}
                      className="aspect-square h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-[92px] lg:self-start">
            <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{product.category?.name ?? "Product"}</Badge>
                <Badge variant={product.status === "OUT_OF_STOCK" ? "secondary" : "success"}>
                  {product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-[-.04em] sm:text-4xl">{product.name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {product.review_count > 0 ? (
                  <>
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {product.rating?.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      {product.review_count} review{product.review_count === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">New listing</span>
                )}
              </div>

              <p className="mt-5 text-3xl font-bold tracking-tight">GH₵{product.price.toFixed(2)}</p>

              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {product.description || "No description provided."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/60 p-3">
                  <span className="text-xs font-medium text-muted-foreground">Stock</span>
                  <strong className="mt-1 block text-sm">{product.stock_quantity} available</strong>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <span className="text-xs font-medium text-muted-foreground">Store status</span>
                  <strong className="mt-1 block text-sm">
                    {product.business.availability_status === "OPEN" ? "Open" : "Unavailable"}
                  </strong>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <span className="text-xs font-medium text-muted-foreground">Fulfilment</span>
                  <strong className="mt-1 block text-sm">
                    {product.business.seller_delivery_enabled ? "Delivery available" : "Pickup"}
                  </strong>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[.12em] text-primary-text">Sold by</span>
                    <Link
                      to={`/businesses/${product.business.slug}`}
                      className="mt-1 block text-lg font-semibold text-foreground hover:text-primary-text"
                    >
                      {product.business.name}
                    </Link>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      {product.business.university?.name || product.business.location_text}
                    </p>
                  </div>

                  <Link
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    to={`/businesses/${product.business.slug}`}
                  >
                    <Store className="size-4" />
                    Store
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {product.business.pickup_enabled && (
                    <Badge variant="outline" className="gap-1.5">
                      <CheckCircle2 className="size-3.5 text-success-foreground" />
                      Pickup
                    </Badge>
                  )}
                  {product.business.seller_delivery_enabled && (
                    <Badge variant="outline" className="gap-1.5">
                      <Truck className="size-3.5 text-success-foreground" />
                      Seller delivery
                    </Badge>
                  )}
                </div>
              </div>

              {wishlistError && (
                <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
                  {wishlistError}
                </div>
              )}
              {cartError && (
                <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
                  {cartError}
                </div>
              )}
              {cartMessage && (
                <div className="mt-4 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">
                  {cartMessage} <Link className="font-semibold underline" to="/cart">View cart</Link>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {user ? (
                  <button
                    data-ui="product-add-cart"
                    type="button"
                    disabled={unavailable || cartLoading}
                    onClick={() => void handleAddToCart()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:saturate-50"
                  >
                    <ShoppingCart className="size-4" />
                    {unavailable ? "Currently unavailable" : cartLoading ? "Adding…" : "Add to cart"}
                  </button>
                ) : (
                  <Link className={cn(buttonVariants({ size: "lg" }), "h-12")} to="/login">
                    <ShoppingCart className="size-4" />
                    Login to add to cart
                  </Link>
                )}

                {user ? (
                  <button
                    data-ui="product-wishlist"
                    type="button"
                    disabled={wishlistLoading}
                    onClick={() => void toggleWishlist()}
                    className={cn(
                      "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition disabled:saturate-50",
                      wishlisted
                        ? "border-primary/20 bg-primary/10 text-primary-text"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    )}
                  >
                    <Heart className={cn("size-4", wishlisted && "fill-current")} />
                    {wishlistLoading ? "Saving…" : wishlisted ? "Saved" : "Add to wishlist"}
                  </button>
                ) : (
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12")}
                    to="/login"
                  >
                    <Heart className="size-4" />
                    Login to save
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <PublicReviewsPanel targetType="PRODUCT" targetId={product.id} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ReportForm targetType="PRODUCT" targetId={product.id} label="Product" />
          </div>
        </section>
      </div>
    </main>
  );
}
