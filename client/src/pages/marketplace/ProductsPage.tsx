import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  Filter,
  MapPin,
  PackageSearch,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  Truck
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";
import { getCategories, type Category } from "../../services/category.service";
import {
  getPublicProducts,
  type PublicProduct,
  type PublicProductFilters
} from "../../services/product.service";
import { getUniversities, type University } from "../../services/university.service";

function imageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function primaryImage(product: PublicProduct) {
  return product.images.find((image) => image.is_primary) ?? product.images[0] ?? null;
}

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [university, setUniversity] = useState(() => searchParams.get("university") ?? "");
  const [businessType, setBusinessType] = useState(() => searchParams.get("businessType") ?? "");
  const [availability, setAvailability] = useState(() => searchParams.get("availability") ?? "");
  const [stock, setStock] = useState(() => searchParams.get("stock") ?? "");
  const [fulfilment, setFulfilment] = useState(() => searchParams.get("fulfilment") ?? "");
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "NEWEST");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function currentFilters(): PublicProductFilters {
    return {
      search: search.trim() || undefined,
      category: category || undefined,
      university: university || undefined,
      businessType: (businessType || undefined) as PublicProductFilters["businessType"],
      availability: (availability || undefined) as PublicProductFilters["availability"],
      stock: (stock || undefined) as PublicProductFilters["stock"],
      fulfilment: (fulfilment || undefined) as PublicProductFilters["fulfilment"],
      minPrice: numberOrUndefined(minPrice),
      maxPrice: numberOrUndefined(maxPrice),
      sort: (sort || undefined) as PublicProductFilters["sort"]
    };
  }

  async function load(filters: PublicProductFilters) {
    setLoading(true);
    setError("");

    try {
      const response = await getPublicProducts(filters);
      setProducts(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial: PublicProductFilters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      university: searchParams.get("university") || undefined,
      businessType: (searchParams.get("businessType") || undefined) as PublicProductFilters["businessType"],
      availability: (searchParams.get("availability") || undefined) as PublicProductFilters["availability"],
      stock: (searchParams.get("stock") || undefined) as PublicProductFilters["stock"],
      fulfilment: (searchParams.get("fulfilment") || undefined) as PublicProductFilters["fulfilment"],
      minPrice: numberOrUndefined(searchParams.get("minPrice") ?? ""),
      maxPrice: numberOrUndefined(searchParams.get("maxPrice") ?? ""),
      sort: (searchParams.get("sort") || "NEWEST") as PublicProductFilters["sort"]
    };

    void load(initial);
    void Promise.all([getCategories(), getUniversities()])
      .then(([categoryResponse, universityResponse]) => {
        setCategories(categoryResponse.data ?? []);
        setUniversities(universityResponse.data ?? []);
      })
      .catch(() => undefined);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const filters = currentFilters();
    const next = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") next.set(key, String(value));
    });

    setSearchParams(next);
    void load(filters);
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setUniversity("");
    setBusinessType("");
    setAvailability("");
    setStock("");
    setFulfilment("");
    setMinPrice("");
    setMaxPrice("");
    setSort("NEWEST");
    setSearchParams(new URLSearchParams());
    void load({ sort: "NEWEST" });
  }

  const activeFilterCount = useMemo(
    () =>
      [search, category, university, businessType, availability, stock, fulfilment, minPrice, maxPrice]
        .filter(Boolean).length,
    [search, category, university, businessType, availability, stock, fulfilment, minPrice, maxPrice]
  );

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section className="mx-auto mt-5 flex w-[min(1240px,calc(100%-32px))] flex-col gap-6 overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-accent/60 via-card to-background px-6 py-8 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-10">
        <div>
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <PackageSearch className="size-3.5" />
            Explore marketplace
          </Badge>
          <h1 className="max-w-3xl text-3xl font-bold tracking-[-.04em] sm:text-4xl">
            Find the right product from sellers around you.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Search, compare and filter products by seller type, availability, fulfilment and price.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-fit bg-card shadow-xs")}
          to="/businesses"
        >
          <Store className="size-4" />
          Explore stores
        </Link>
      </section>

      <div className="mx-auto mt-6 grid w-[min(1240px,calc(100%-32px))] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[88px] lg:h-[calc(100vh-108px)]">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="size-4 text-primary-text" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-2 py-0.5">{activeFilterCount}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Refine marketplace results</p>
              </div>

              <button
                data-ui="catalog-reset"
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <RefreshCcw className="size-3.5" />
                Reset
              </button>
            </div>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable]">
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Search
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-9"
                      placeholder="Product name"
                    />
                  </div>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Category
                  <select className={selectClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="">All categories</option>
                    {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  University
                  <select className={selectClass} value={university} onChange={(event) => setUniversity(event.target.value)}>
                    <option value="">All universities</option>
                    {universities.map((item) => (
                      <option value={item.id} key={item.id}>{item.short_name || item.name}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Seller type
                  <select className={selectClass} value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
                    <option value="">All businesses</option>
                    <option value="STUDENT_BUSINESS">Student businesses</option>
                    <option value="OTHER_BUSINESS">Community businesses</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Availability
                  <select className={selectClass} value={availability} onChange={(event) => setAvailability(event.target.value)}>
                    <option value="">Any availability</option>
                    <option value="OPEN">Open now</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Stock
                  <select className={selectClass} value={stock} onChange={(event) => setStock(event.target.value)}>
                    <option value="">Any stock status</option>
                    <option value="IN_STOCK">In stock</option>
                    <option value="OUT_OF_STOCK">Out of stock</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Fulfilment
                  <select className={selectClass} value={fulfilment} onChange={(event) => setFulfilment(event.target.value)}>
                    <option value="">Any fulfilment</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="SELLER_DELIVERY">Seller delivery</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                    Min price
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      placeholder="GH₵0"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                    Max price
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      placeholder="Any"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-border bg-card p-4">
                <button
                  data-ui="catalog-apply"
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  <Filter className="size-4" />
                  Apply filters
                </button>
              </div>
            </form>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[.14em] text-primary-text">Products</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">
                {loading ? "Loading marketplace…" : `${products.length} ${products.length === 1 ? "product" : "products"}`}
              </h2>
            </div>

            <label className="grid min-w-[210px] gap-1.5 text-xs font-semibold text-muted-foreground">
              Sort by
              <select
                className={selectClass}
                value={sort}
                onChange={(event) => {
                  const nextSort = event.target.value;
                  setSort(nextSort);
                  const filters = {
                    ...currentFilters(),
                    sort: nextSort as PublicProductFilters["sort"]
                  };
                  void load(filters);
                }}
              >
                <option value="NEWEST">Newest</option>
                <option value="PRICE_LOW_TO_HIGH">Price: low to high</option>
                <option value="PRICE_HIGH_TO_LOW">Price: high to low</option>
                <option value="NAME_A_TO_Z">Name: A–Z</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[4/3] animate-pulse bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary-text shadow-sm">
                <PackageSearch className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try changing your search or clearing a few filters.
              </p>
              <button
                data-ui="catalog-empty-reset"
                type="button"
                className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const image = primaryImage(product);
                const url = image ? imageUrl(image.storage_path) : null;

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
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
                        <div className="grid h-full place-items-center bg-gradient-to-br from-muted to-accent/60 text-muted-foreground">
                          <Box className="size-8" strokeWidth={1.5} />
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        <Badge variant={product.status === "OUT_OF_STOCK" ? "secondary" : "success"}>
                          {product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}
                        </Badge>
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-xs font-semibold text-primary-text">
                            {product.category?.name ?? "Product"}
                          </p>
                          <Link
                            to={`/products/${product.id}/${product.slug}`}
                            className="mt-1 line-clamp-2 block text-base font-semibold leading-snug text-foreground hover:text-primary-text"
                          >
                            {product.name}
                          </Link>
                        </div>
                        {product.review_count > 0 && (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {product.rating?.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-lg font-bold tracking-tight text-foreground">{money(product.price)}</p>

                      <div className="mt-4 border-t border-border/70 pt-4">
                        <Link
                          to={`/businesses/${product.business.slug}`}
                          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary-text"
                        >
                          <Store className="size-4 text-muted-foreground" />
                          <span className="truncate">{product.business.name}</span>
                        </Link>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {product.business.university?.short_name || product.business.location_text}
                          </span>
                          {product.business.seller_delivery_enabled && (
                            <span className="flex items-center gap-1"><Truck className="size-3.5" /> Delivery</span>
                          )}
                        </div>
                      </div>

                      <Link
                        className="mt-4 flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5 text-sm font-semibold text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground"
                        to={`/products/${product.id}/${product.slug}`}
                      >
                        View product
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
