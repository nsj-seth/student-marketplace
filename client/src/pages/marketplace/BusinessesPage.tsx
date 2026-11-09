import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Filter,
  MapPin,
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
import {
  getPublicBusinesses,
  type PublicBusiness,
  type PublicBusinessFilters
} from "../../services/business.service";
import { getCategories, type Category } from "../../services/category.service";
import { getUniversities, type University } from "../../services/university.service";

function getLogoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function BusinessesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [university, setUniversity] = useState(() => searchParams.get("university") ?? "");
  const [businessType, setBusinessType] = useState(() => searchParams.get("businessType") ?? "");
  const [availability, setAvailability] = useState(() => searchParams.get("availability") ?? "");
  const [fulfilment, setFulfilment] = useState(() => searchParams.get("fulfilment") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "NEWEST");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function currentFilters(): PublicBusinessFilters {
    return {
      search: search.trim() || undefined,
      category: category || undefined,
      university: university || undefined,
      businessType: (businessType || undefined) as PublicBusinessFilters["businessType"],
      availability: (availability || undefined) as PublicBusinessFilters["availability"],
      fulfilment: (fulfilment || undefined) as PublicBusinessFilters["fulfilment"],
      sort: (sort || undefined) as PublicBusinessFilters["sort"]
    };
  }

  async function load(filters: PublicBusinessFilters) {
    setLoading(true);
    setError("");

    try {
      const response = await getPublicBusinesses(filters);
      setBusinesses(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load businesses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial: PublicBusinessFilters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      university: searchParams.get("university") || undefined,
      businessType: (searchParams.get("businessType") || undefined) as PublicBusinessFilters["businessType"],
      availability: (searchParams.get("availability") || undefined) as PublicBusinessFilters["availability"],
      fulfilment: (searchParams.get("fulfilment") || undefined) as PublicBusinessFilters["fulfilment"],
      sort: (searchParams.get("sort") || "NEWEST") as PublicBusinessFilters["sort"]
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
    setFulfilment("");
    setSort("NEWEST");
    setSearchParams(new URLSearchParams());
    void load({ sort: "NEWEST" });
  }

  const activeFilterCount = useMemo(
    () => [search, category, university, businessType, availability, fulfilment].filter(Boolean).length,
    [search, category, university, businessType, availability, fulfilment]
  );

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section className="mx-auto mt-5 flex w-[min(1240px,calc(100%-32px))] flex-col gap-6 overflow-hidden rounded-2xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-10">
        <div>
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Building2 className="size-3.5" />
            Discover stores
          </Badge>
          <h1 className="max-w-3xl text-3xl font-bold tracking-[-.025em] sm:text-4xl">
            Meet local businesses worth discovering.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Browse student entrepreneurs and community sellers, then filter by category, university and fulfilment.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-fit bg-card shadow-xs")}
          to="/products"
        >
          <Store className="size-4" />
          Browse products
        </Link>
      </section>

      <div className="mx-auto mt-6 grid w-[min(1240px,calc(100%-32px))] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[88px] lg:h-[calc(100vh-108px)]">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="size-4 text-primary-text" />
                  Store filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-2 py-0.5">{activeFilterCount}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Narrow down the directory</p>
              </div>

              <button
                data-ui="business-reset"
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
                      placeholder="Name, location or description"
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
                  Business type
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
                  Fulfilment
                  <select className={selectClass} value={fulfilment} onChange={(event) => setFulfilment(event.target.value)}>
                    <option value="">Any fulfilment</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="SELLER_DELIVERY">Seller delivery</option>
                  </select>
                </label>
              </div>

              <div className="border-t border-border bg-card p-4">
                <button
                  data-ui="business-apply"
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
              <p className="m-0 text-xs font-bold uppercase tracking-[.1em] text-primary-text">Stores</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">
                {loading ? "Loading stores…" : `${businesses.length} ${businesses.length === 1 ? "store" : "stores"}`}
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
                  void load({
                    ...currentFilters(),
                    sort: nextSort as PublicBusinessFilters["sort"]
                  });
                }}
              >
                <option value="NEWEST">Newest</option>
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
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="h-24 animate-pulse bg-muted" />
                  <div className="space-y-3 p-5 pt-12">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && businesses.length === 0 && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary-text shadow-sm">
                <Building2 className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">No stores found</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try another category, university or search term.
              </p>
              <button
                data-ui="business-empty-reset"
                type="button"
                className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && businesses.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {businesses.map((business) => {
                const logo = getLogoUrl(business.logo_path);

                return (
                  <article
                    className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-sm"
                    key={business.id}
                  >
                    <div className="relative h-24 overflow-hidden bg-accent/50">
                      <div className="absolute left-4 top-4">
                        <Badge className="border-border bg-card text-foreground">
                          {business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Community business"}
                        </Badge>
                      </div>
                    </div>

                    <div className="relative p-5 pt-12">
                      <div className="absolute -top-9 left-5 grid size-[72px] place-items-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-md">
                        {logo ? (
                          <img src={logo} alt={`${business.name} logo`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-primary-text">
                            {business.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/businesses/${business.slug}`}
                            className="block truncate text-lg font-semibold text-foreground hover:text-primary-text"
                          >
                            {business.name}
                          </Link>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">
                              {business.university?.short_name || business.university?.name || business.location_text}
                            </span>
                          </p>
                        </div>

                        <Badge variant={business.availability_status === "OPEN" ? "success" : "secondary"}>
                          {business.availability_status === "OPEN" ? "Open" : "Unavailable"}
                        </Badge>
                      </div>

                      <p className="mt-4 line-clamp-2 min-h-[44px] text-sm leading-6 text-muted-foreground">
                        {business.description}
                      </p>

                      {business.categories.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {business.categories.slice(0, 3).map((categoryItem) => (
                            <Badge variant="outline" key={categoryItem.id}>
                              {categoryItem.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
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
                          <span className="flex items-center gap-1"><Store className="size-3.5" /> Pickup</span>
                        )}

                        {business.seller_delivery_enabled && (
                          <span className="flex items-center gap-1"><Truck className="size-3.5" /> Delivery</span>
                        )}
                      </div>

                      <Link
                        className="mt-4 flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5 text-sm font-semibold text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground"
                        to={`/businesses/${business.slug}`}
                      >
                        Visit storefront
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
