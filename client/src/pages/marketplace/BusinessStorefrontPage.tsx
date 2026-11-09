import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Star,
  Store,
  Truck
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { PublicReviewsPanel } from "../../components/reviews/PublicReviewsPanel";
import { ReportForm } from "../../components/reports/ReportForm";
import { supabase } from "../../lib/supabase";
import { getPublicBusiness, type PublicBusiness } from "../../services/business.service";
import { getPublicProducts, type PublicProduct } from "../../services/product.service";

function getLogoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

function getProductImageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function BusinessStorefrontPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug) return;

      try {
        const response = await getPublicBusiness(slug);
        const loaded = response.data ?? null;

        if (active) setBusiness(loaded);

        if (loaded) {
          const productsResponse = await getPublicProducts({ business: loaded.id });
          if (active) setProducts(productsResponse.data ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load storefront.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-6 w-[min(1240px,calc(100%-32px))]">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-[4/3] animate-pulse bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(760px,calc(100%-32px))] rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Building2 className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Storefront unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "Business not found."}</p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/businesses">
            Back to businesses
          </Link>
        </section>
      </main>
    );
  }

  const logoUrl = getLogoUrl(business.logo_path);
  const socialEntries = Object.entries(business.social_links).filter(([, value]) => Boolean(value));

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1240px,calc(100%-32px))]">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-primary-text" to="/">Home</Link>
          <span>/</span>
          <Link className="hover:text-primary-text" to="/businesses">Stores</Link>
          <span>/</span>
          <span className="max-w-[280px] truncate text-foreground">{business.name}</span>
        </nav>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="hero-surface relative h-36 overflow-hidden sm:h-44">
          </div>

          <div className="relative px-6 pb-7 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${business.name} logo`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary-text">
                      {business.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Community business"}
                    </Badge>
                    <Badge variant={business.availability_status === "OPEN" ? "success" : "secondary"}>
                      {business.availability_status === "OPEN" ? "Open now" : "Unavailable"}
                    </Badge>
                  </div>

                  <h1 className="mt-3 text-3xl font-bold tracking-[-.025em] sm:text-4xl">{business.name}</h1>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-4" />
                      {business.university?.name || business.location_text}
                    </span>

                    {business.review_count > 0 ? (
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {business.rating?.toFixed(1)}
                        <span className="font-normal text-muted-foreground">
                          ({business.review_count} review{business.review_count === 1 ? "" : "s"})
                        </span>
                      </span>
                    ) : (
                      <span>New store</span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to={`/products?business=${encodeURIComponent(business.id)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <ShoppingBag className="size-4" />
                Shop this store
              </Link>
            </div>

            <p className="mt-6 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">
              {business.description}
            </p>

            {business.categories.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {business.categories.map((category) => (
                  <Badge variant="outline" key={category.id}>{category.name}</Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
              <MapPin className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">Store details</h2>
            <div className="mt-4 space-y-3 text-sm">
              {business.university && (
                <div>
                  <span className="block text-xs font-medium text-muted-foreground">University</span>
                  <strong className="mt-1 block">{business.university.name}</strong>
                </div>
              )}
              <div>
                <span className="block text-xs font-medium text-muted-foreground">Location</span>
                <strong className="mt-1 block">{business.location_text}</strong>
              </div>
              <div>
                <span className="block text-xs font-medium text-muted-foreground">Contact</span>
                <strong className="mt-1 flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {business.contact_phone}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
              <Truck className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">Fulfilment</h2>
            <div className="mt-4 space-y-3">
              {business.pickup_enabled && (
                <div className="flex gap-3 rounded-xl bg-muted/60 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                  <div>
                    <strong className="block text-sm">Customer pickup</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Arrange a pickup directly with the seller.
                    </span>
                  </div>
                </div>
              )}
              {business.seller_delivery_enabled && (
                <div className="flex gap-3 rounded-xl bg-muted/60 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                  <div>
                    <strong className="block text-sm">Seller delivery</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      The seller can deliver your order.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
              <Globe2 className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">Online presence</h2>
            {socialEntries.length > 0 ? (
              <div className="mt-4 space-y-3 text-sm">
                {socialEntries.map(([label, value]) => (
                  <div key={label}>
                    <span className="block text-xs font-medium capitalize text-muted-foreground">{label}</span>
                    <span className="mt-1 block break-all font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This seller has not added social links yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Shop the store</span>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">Products from {business.name}</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {products.length} item{products.length === 1 ? "" : "s"}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
              <Package className="size-7 text-primary-text" />
              <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This store does not currently have any public products.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => {
                const image = product.images.find((item) => item.is_primary) ?? product.images[0] ?? null;
                const url = getProductImageUrl(image?.storage_path ?? null);

                return (
                  <article
                    className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-sm"
                    key={product.id}
                  >
                    <Link
                      className="relative block aspect-[4/3] overflow-hidden bg-muted"
                      to={`/products/${product.id}/${product.slug}`}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt={image?.alt_text ?? product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground">
                          <Package className="size-8" strokeWidth={1.5} />
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        <Badge variant={product.status === "OUT_OF_STOCK" ? "secondary" : "success"}>
                          {product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}
                        </Badge>
                      </div>
                    </Link>

                    <div className="p-4">
                      <p className="m-0 text-xs font-semibold text-primary-text">{product.category?.name ?? "Product"}</p>
                      <Link
                        to={`/products/${product.id}/${product.slug}`}
                        className="mt-1 line-clamp-2 block text-base font-semibold leading-snug text-foreground hover:text-primary-text"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-3 text-lg font-bold tracking-tight">GH₵{product.price.toFixed(2)}</p>

                      <div className="mt-3 flex items-center justify-between">
                        {product.review_count > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {product.rating?.toFixed(1)}
                            <span className="font-normal text-muted-foreground">({product.review_count})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">New listing</span>
                        )}

                        <ArrowRight className="size-4 text-muted-foreground transition group-hover:text-primary-text" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <PublicReviewsPanel targetType="BUSINESS" targetId={business.id} />
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ReportForm targetType="BUSINESS" targetId={business.id} label="Business" />
            <div className="border-t border-border pt-4">
              <ReportForm targetType="SELLER" targetId={business.id} label="Seller" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
