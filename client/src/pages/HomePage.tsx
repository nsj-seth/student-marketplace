import { FormEvent, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Laptop,
  MapPin,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Utensils,
  Wrench
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import type { PublicBusiness } from "../services/business.service";
import { getMarketplaceHome, type MarketplaceHomeData } from "../services/marketplace.service";
import type { PublicProduct } from "../services/product.service";

function productImage(product: PublicProduct) {
  const image = product.images.find((item) => item.is_primary) ?? product.images[0];
  return image
    ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl
    : null;
}

function businessLogo(path: string | null) {
  return path
    ? supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl
    : null;
}

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

function categoryIcon(name: string): ComponentType<{ className?: string; strokeWidth?: number }> {
  const key = name.toLowerCase();

  if (key.includes("food") || key.includes("bak")) return Utensils;
  if (key.includes("fashion") || key.includes("cloth")) return Shirt;
  if (key.includes("elect") || key.includes("tech")) return Laptop;
  if (key.includes("beauty") || key.includes("care")) return Sparkles;
  if (key.includes("book") || key.includes("station")) return BookOpen;
  if (key.includes("access")) return Backpack;
  if (key.includes("service")) return Wrench;
  return Package;
}

function ProductCard({
  product,
  featured = false
}: {
  product: PublicProduct;
  featured?: boolean;
}) {
  const image = productImage(product);

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-sm">
      <Link
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        to={`/products/${product.id}/${product.slug}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-muted to-accent/70 text-muted-foreground">
            <ShoppingBag className="size-8" strokeWidth={1.5} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {featured && (
            <Badge className="border-white/20 bg-card text-primary-text shadow-sm backdrop-blur">
              <Sparkles className="size-3" />
              Featured
            </Badge>
          )}
          {product.status === "OUT_OF_STOCK" && (
            <Badge variant="secondary" className="bg-card shadow-sm backdrop-blur">
              Out of stock
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="truncate font-medium">{product.category?.name ?? "Product"}</span>
          {product.review_count > 0 ? (
            <span className="flex shrink-0 items-center gap-1 font-semibold text-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {product.rating?.toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0">New</span>
          )}
        </div>

        <Link
          to={`/products/${product.id}/${product.slug}`}
          className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary-text"
        >
          {product.name}
        </Link>

        <Link
          className="mt-1.5 block truncate text-xs font-medium text-muted-foreground hover:text-primary-text"
          to={`/businesses/${product.business.slug}`}
        >
          {product.business.name}
        </Link>

        <div className="mt-4 flex items-end justify-between gap-3">
          <strong className="text-lg font-bold tracking-tight text-foreground">{money(product.price)}</strong>
          <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Card>
  );
}

function BusinessCard({
  business,
  featured = false
}: {
  business: PublicBusiness;
  featured?: boolean;
}) {
  const logo = businessLogo(business.logo_path);

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/80 shadow-sm transition-all duration-300 hover:shadow-sm">
      <div className="relative h-24 overflow-hidden bg-accent/50">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-4">
          <Badge className="border-border bg-card text-foreground">
            {business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Community business"}
          </Badge>
          {featured && (
            <span className="flex items-center gap-1 text-xs font-semibold text-primary-text">
              <Star className="size-3.5 text-primary-text" /> Featured
            </span>
          )}
        </div>
      </div>

      <div className="relative p-5 pt-12">
        <div className="absolute -top-9 left-5 grid size-[72px] place-items-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-md">
          {logo ? (
            <img src={logo} alt={`${business.name} logo`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary-text">{business.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/businesses/${business.slug}`}
              className="block truncate text-base font-semibold text-foreground hover:text-primary-text"
            >
              {business.name}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{business.university?.short_name || business.location_text}</span>
            </p>
          </div>

          <Badge variant={business.availability_status === "OPEN" ? "success" : "secondary"}>
            {business.availability_status === "OPEN" ? "Open" : "Unavailable"}
          </Badge>
        </div>

        <p className="line-clamp-2 min-h-[42px] text-sm leading-6 text-muted-foreground">
          {business.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          {business.review_count > 0 ? (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {business.rating?.toFixed(1)}
              <span className="font-normal text-muted-foreground">({business.review_count})</span>
            </span>
          ) : (
            <span>New store</span>
          )}

          {business.pickup_enabled && (
            <span className="flex items-center gap-1"><ShoppingBag className="size-3.5" /> Pickup</span>
          )}
          {business.seller_delivery_enabled && (
            <span className="flex items-center gap-1"><Truck className="size-3.5" /> Delivery</span>
          )}

          <Link
            to={`/businesses/${business.slug}`}
            className="ml-auto flex items-center gap-1 font-semibold text-primary-text"
          >
            Visit <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketplaceHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"products" | "businesses">("products");

  useEffect(() => {
    getMarketplaceHome()
      .then((response) => setData(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load marketplace."))
      .finally(() => setLoading(false));
  }, []);

  const showcaseProducts = useMemo(() => {
    if (!data) return [];
    return (data.featuredProducts.length ? data.featuredProducts : data.newProducts).slice(0, 4);
  }, [data]);

  const heroProduct = showcaseProducts[0];
  const heroImage = heroProduct ? productImage(heroProduct) : null;

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    const params = term ? `?search=${encodeURIComponent(term)}` : "";
    navigate(`/${searchType}${params}`);
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section aria-labelledby="home-heading" className="hero-surface mx-auto mt-6 grid w-[min(1240px,calc(100%-32px))] overflow-hidden rounded-2xl border border-border lg:grid-cols-[1.1fr_.9fr]">
        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12">
          <span className="mb-5 flex items-center gap-2 text-sm font-semibold text-hero-accent">
            <Sparkles className="size-4" aria-hidden="true" />
            Student & community marketplace
          </span>
          <h1 id="home-heading" className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-.035em] text-hero-foreground sm:text-5xl">
            Great finds.
            <span className="block text-hero-accent">Closer to you.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-hero-muted">
            Shop student and community businesses. Find your next everyday favourite, right where you are.
          </p>

          <form className="mt-7 max-w-xl rounded-xl border border-input bg-card p-2" onSubmit={submitSearch} role="search" aria-label="Discover products and businesses">
            <div className="mb-2 flex gap-1 border-b border-border px-1 pb-2">
              {(["products", "businesses"] as const).map((type) => (
                <button
                  key={type}
                  data-ui="home-search-type"
                  type="button"
                  aria-pressed={searchType === type}
                  className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", searchType === type ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  onClick={() => setSearchType(type)}
                >
                  {type === "products" ? "Products" : "Businesses"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                data-ui="home-search-input"
                aria-label={searchType === "products" ? "Search products" : "Search businesses"}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder={searchType === "products" ? "What are you looking for?" : "Find a business..."}
              />
              <button data-ui="home-search-submit" type="submit" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Search <ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-hero-muted">
            <span className="flex items-center gap-1.5"><BadgeCheck className="size-4" aria-hidden="true" /> Verified sellers</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" /> Local discovery</span>
            <span className="flex items-center gap-1.5"><Star className="size-4" aria-hidden="true" /> Customer reviews</span>
          </div>
        </div>

        <div className="m-5 mt-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:my-6 lg:ml-0 lg:mr-6">
          <div className="relative min-h-52 flex-1 overflow-hidden bg-accent/40 lg:min-h-72">
            {heroImage ? (
              <img src={heroImage} alt={heroProduct?.name ?? "Featured marketplace product"} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-4 p-8 text-center text-primary-text lg:min-h-72">
                <ShoppingBag className="size-12" strokeWidth={1.4} aria-hidden="true" />
                <span className="text-lg font-medium">Good things from your community.</span>
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">Marketplace spotlight</span>
          </div>
          {heroProduct ? (
            <Link to={`/products/${heroProduct.id}/${heroProduct.slug}`} className="flex items-center justify-between gap-4 border-t border-border p-5 text-foreground transition-colors hover:bg-muted">
              <span className="min-w-0">
                <span className="mb-1 block text-sm text-muted-foreground">{heroProduct.business.name}</span>
                <strong className="block text-base font-semibold">{heroProduct.name}</strong>
                <span className="mt-1 block text-sm font-semibold text-primary-text">{money(heroProduct.price)}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-primary-text" aria-hidden="true" />
            </Link>
          ) : (
            <div className="border-t border-border p-5">
              <strong className="block text-base font-semibold text-foreground">Discover something local</strong>
              <p className="mt-1 text-sm text-muted-foreground">Explore products and meet the businesses behind them.</p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="mx-auto mt-6 w-[min(1240px,calc(100%-32px))] rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      {loading && (
        <div className="mx-auto mt-10 grid w-[min(1240px,calc(100%-32px))] gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {data && (
        <>
          <section className="mx-auto mt-14 w-[min(1240px,calc(100%-32px))]">
            <div className="mb-6 flex items-end justify-between gap-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Explore by category</span>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">Start with what you need.</h2>
              </div>
              <Link className="hidden items-center gap-1 text-sm font-semibold text-primary-text sm:flex" to="/products">
                Browse everything <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {data.categories.slice(0, 8).map((category) => {
                const Icon = categoryIcon(category.name);
                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${encodeURIComponent(category.id)}`}
                    className="group rounded-2xl border border-border/80 bg-card p-4 text-center shadow-sm transition-all hover:border-primary/20 hover:shadow-sm"
                  >
                    <span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/8 text-primary-text transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </span>
                    <span className="mt-3 block truncate text-sm font-semibold text-foreground">{category.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {data.featuredProducts.length > 0 && (
            <section className="mx-auto mt-16 w-[min(1240px,calc(100%-32px))]">
              <div className="mb-6 flex items-end justify-between gap-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Handpicked</span>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">Featured marketplace finds</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Popular products worth a closer look.</p>
                </div>
                <Link className="hidden items-center gap-1 text-sm font-semibold text-primary-text sm:flex" to="/products">
                  Shop all <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.featuredProducts.slice(0, 8).map((product) => (
                  <ProductCard product={product} featured key={product.id} />
                ))}
              </div>
            </section>
          )}

          <section className="mx-auto mt-16 grid w-[min(1240px,calc(100%-32px))] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm lg:grid-cols-[1fr_auto]">
            <div className="relative overflow-hidden p-8 sm:p-10">
              <div className="relative">
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Built for local sellers</span>
                <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-.025em] text-foreground">
                  Your next customer could be right here.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Create your business profile, list products and manage customer orders from one marketplace account.
                </p>
              </div>
            </div>
            <div className="flex items-center p-8 pt-0 lg:p-10 lg:pl-0">
              <Link
                className={cn(buttonVariants({ size: "lg" }))}
                to="/sell"
              >
                Start selling <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>

          {data.featuredBusinesses.length > 0 && (
            <section className="mx-auto mt-16 w-[min(1240px,calc(100%-32px))]">
              <div className="mb-6 flex items-end justify-between gap-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Businesses to know</span>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">Featured stores</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Discover sellers building something worth supporting.</p>
                </div>
                <Link className="hidden items-center gap-1 text-sm font-semibold text-primary-text sm:flex" to="/businesses">
                  See all stores <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.featuredBusinesses.slice(0, 6).map((business) => (
                  <BusinessCard business={business} featured key={business.id} />
                ))}
              </div>
            </section>
          )}

          <section className="mx-auto mt-16 w-[min(1240px,calc(100%-32px))]">
            <div className="mb-6 flex items-end justify-between gap-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Fresh listings</span>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">New marketplace finds</h2>
                <p className="mt-2 text-sm text-muted-foreground">Recently added products from across the community.</p>
              </div>
              <Link className="hidden items-center gap-1 text-sm font-semibold text-primary-text sm:flex" to="/products?sort=NEWEST">
                Browse newest <ArrowRight className="size-4" />
              </Link>
            </div>

            {data.newProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.newProducts.slice(0, 8).map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                No products have been added yet.
              </div>
            )}
          </section>

          <section className="mx-auto mt-16 w-[min(1240px,calc(100%-32px))]">
            <div className="mb-6 flex items-end justify-between gap-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Meet new sellers</span>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">Recently joined businesses</h2>
              </div>
              <Link className="hidden items-center gap-1 text-sm font-semibold text-primary-text sm:flex" to="/businesses?sort=NEWEST">
                Explore directory <ArrowRight className="size-4" />
              </Link>
            </div>

            {data.newBusinesses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.newBusinesses.slice(0, 6).map((business) => (
                  <BusinessCard business={business} key={business.id} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                No businesses have joined yet.
              </div>
            )}
          </section>

          <section className="mx-auto mt-16 grid w-[min(1240px,calc(100%-32px))] gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border/80 bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
                <MapPin className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">Discover locally</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Find sellers connected to campuses and communities near you.</p>
            </article>

            <article className="rounded-2xl border border-border/80 bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
                <CheckCircle2 className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">Shop confidently</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">See availability, seller details and verified-purchase reviews.</p>
            </article>

            <article className="rounded-2xl border border-border/80 bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
                <Truck className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">Track every order</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Follow each seller's fulfilment progress from one account.</p>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
