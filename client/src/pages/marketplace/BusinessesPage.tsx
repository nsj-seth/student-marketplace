import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getPublicBusinesses, type PublicBusiness, type PublicBusinessFilters } from "../../services/business.service";
import { getCategories, type Category } from "../../services/category.service";
import { getUniversities, type University } from "../../services/university.service";

function getLogoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

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

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Marketplace</span>
        <h1>Businesses</h1>
        <p>Find approved businesses by category, university, type, availability and fulfilment.</p>

        <form className="marketplace-filter marketplace-filter--expanded" onSubmit={submit}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, description or location" />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <select value={university} onChange={(event) => setUniversity(event.target.value)}>
            <option value="">All universities</option>
            {universities.map((item) => <option value={item.id} key={item.id}>{item.short_name || item.name}</option>)}
          </select>
          <select value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
            <option value="">All business types</option>
            <option value="STUDENT_BUSINESS">Student businesses</option>
            <option value="OTHER_BUSINESS">Other businesses</option>
          </select>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <option value="">Any availability</option>
            <option value="OPEN">Open</option>
            <option value="UNAVAILABLE">Currently unavailable</option>
          </select>
          <select value={fulfilment} onChange={(event) => setFulfilment(event.target.value)}>
            <option value="">Any fulfilment</option>
            <option value="PICKUP">Pickup</option>
            <option value="SELLER_DELIVERY">Seller delivery</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="NEWEST">Newest approved</option>
            <option value="NAME_A_TO_Z">Name: A–Z</option>
          </select>
          <div className="actions">
            <button type="submit">Apply filters</button>
            <button type="button" className="secondary-button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading businesses...</p>}
        {!loading && !error && <p><strong>{businesses.length}</strong> business{businesses.length === 1 ? "" : "es"} found.</p>}
        {!loading && !error && businesses.length === 0 && <p>No businesses matched your filters.</p>}

        <div className="business-grid">
          {businesses.map((business) => {
            const logoUrl = getLogoUrl(business.logo_path);
            return (
              <article className="business-card" key={business.id}>
                {logoUrl ? <img src={logoUrl} alt={`${business.name} logo`} className="storefront-logo" /> : <div className="storefront-logo storefront-logo--empty">No logo</div>}
                <div>
                  <div className="business-card__topline">
                    <span>{business.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}</span>
                    <span className={`availability-badge availability-badge--${business.availability_status.toLowerCase()}`}>
                      {business.availability_status === "OPEN" ? "Open" : "Unavailable"}
                    </span>
                  </div>
                  <h2>{business.name}</h2>
                  <p>{business.description}</p>
                  <p><strong>Location:</strong> {business.university?.short_name || business.university?.name || business.location_text}</p>
                  <p><strong>Categories:</strong> {business.categories.map((item) => item.name).join(", ") || "None"}</p>
                  <p><strong>Fulfilment:</strong> {business.pickup_enabled ? "Pickup" : ""}{business.pickup_enabled && business.seller_delivery_enabled ? " · " : ""}{business.seller_delivery_enabled ? "Seller delivery" : ""}</p>
                  <Link className="button-link" to={`/businesses/${business.slug}`}>View storefront</Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/products">Browse products</Link>
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
