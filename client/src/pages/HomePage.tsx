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
    <Card className="group overflow-hidden rounded-[1.35rem] border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <Link
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        to={`/products/${product.id}/${product.slug}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
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
    <Card className="group overflow-hidden rounded-[1.35rem] border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-violet-800 via-primary to-violet-700">
        <div className="absolute -right-8 -top-10 size-32 rounded-full border border-white/20" />
        <div className="absolute bottom-[-35px] left-1/3 size-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-4">
          <Badge className="border-border bg-card text-foreground">
            {business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Community business"}
          </Badge>
          {featured && (
            <span className="flex items-center gap-1 text-xs font-semibold text-white">
              <Star className="size-3.5 fill-white text-white" /> Featured
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
      <section className="mx-auto mt-5 grid w-[min(1240px,calc(100%-32px))] overflow-hidden rounded-[2rem] border border-border/70 hero-surface shadow-2xl shadow-violet-950/10 lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="relative">
            <Badge className="mb-5 border-border bg-card px-3 py-1.5 text-primary-text shadow-sm">
              <Sparkles className="size-3.5" />
              Student & community marketplace
            </Badge>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.02] tracking-[-0.045em] text-hero-foreground sm:text-5xl lg:text-[4.25rem]">
              Find great things
              <span className="block text-hero-accent">
                closer to home.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-hero-muted sm:text-lg">
              Discover products, services and growing businesses from students and communities around you.
            </p>

            <form
              className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-input bg-card p-2 shadow-xl"
              onSubmit={submitSearch}
            >
              <div className="mb-2 flex gap-1 px-1">
                <button
                  data-ui="home-search-type"
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    searchType === "products"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setSearchType("products")}
                >
                  Products
                </button>
                <button
                  data-ui="home-search-type"
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    searchType === "businesses"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setSearchType("businesses")}
                >
                  Businesses
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
                <input
                  data-ui="home-search-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder={searchType === "products" ? "What are you looking for?" : "Find a business..."}
                />
                <button
                  data-ui="home-search-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Search <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-hero-muted">
              <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-hero-accent" /> Verified sellers</span>
              <span className="flex items-center gap-2"><MapPin className="size-4 text-hero-accent" /> Local discovery</span>
              <span className="flex items-center gap-2"><Star className="size-4 text-hero-accent" /> Customer reviews</span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[370px] overflow-hidden lg:min-h-full">
          {heroImage ? (
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-fuchsia-900" />
          )}
          <div className="hero-image-scrim absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:left-8 sm:right-auto sm:w-[310px]">
            {heroProduct && (
              <Link
                to={`/products/${heroProduct.id}/${heroProduct.slug}`}
                className="rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl transition hover:bg-muted"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Featured right now</span>
                  <ArrowUpRight className="size-4" />
                </div>
                <strong className="mt-2 block text-base">{heroProduct.name}</strong>
                <span className="mt-1 block text-sm font-semibold text-primary-text">{money(heroProduct.price)}</span>
              </Link>
            )}
          </div>
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
                <span className="text-xs font-bold uppercase tracking-[.16em] text-primary-text">Explore by category</span>
                <h2 className="mt-2 text-2xl font-bold tracking-[-.03em] sm:text-3xl">Start with what you need.</h2>
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
                    className="group rounded-2xl border border-border/80 bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
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
                  <span className="text-xs font-bold uppercase tracking-[.16em] text-primary-text">Handpicked</span>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-.03em] sm:text-3xl">Featured marketplace finds</h2>
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

          <section className="mx-auto mt-16 grid w-[min(1240px,calc(100%-32px))] overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground shadow-xl shadow-primary/10 lg:grid-cols-[1fr_auto]">
            <div className="relative overflow-hidden p-8 sm:p-10">
              <div className="absolute -bottom-24 -left-10 size-52 rounded-full border border-white/15" />
              <div className="relative">
                <span className="text-xs font-bold uppercase tracking-[.16em] text-violet-200">Built for local sellers</span>
                <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-.035em] text-white">
                  Turn what you do into a storefront people can discover.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
                  Create your business profile, list products and manage customer orders from one marketplace account.
                </p>
              </div>
            </div>
            <div className="flex items-center p-8 pt-0 lg:p-10 lg:pl-0">
              <Link
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "bg-card text-primary-text hover:bg-accent")}
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
                  <span className="text-xs font-bold uppercase tracking-[.16em] text-primary-text">Businesses to know</span>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-.03em] sm:text-3xl">Featured stores</h2>
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
                <span className="text-xs font-bold uppercase tracking-[.16em] text-primary-text">Fresh listings</span>
                <h2 className="mt-2 text-2xl font-bold tracking-[-.03em] sm:text-3xl">New marketplace finds</h2>
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
                <span className="text-xs font-bold uppercase tracking-[.16em] text-primary-text">Meet new sellers</span>
                <h2 className="mt-2 text-2xl font-bold tracking-[-.03em] sm:text-3xl">Recently joined businesses</h2>
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
