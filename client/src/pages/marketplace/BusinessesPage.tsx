import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getPublicBusinesses, type PublicBusiness } from "../../services/business.service";

function getLogoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

export function BusinessesPage() {
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(filters: { search?: string; businessType?: string; availability?: string } = {}) {
    setLoading(true);
    setError("");
    try {
      const response = await getPublicBusinesses({
        search: filters.search || undefined,
        businessType: (filters.businessType || undefined) as "STUDENT_BUSINESS" | "OTHER_BUSINESS" | undefined,
        availability: (filters.availability || undefined) as "OPEN" | "UNAVAILABLE" | undefined
      });
      setBusinesses(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load businesses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load({ search, businessType, availability });
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Marketplace</span>
        <h1>Businesses</h1>
        <p>Browse approved businesses currently available on the marketplace.</p>

        <form className="marketplace-filter" onSubmit={submit}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business name or description"
          />
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
          <button type="submit">Apply</button>
        </form>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading businesses...</p>}
        {!loading && !error && businesses.length === 0 && <p>No businesses matched your search.</p>}

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
                  <p><strong>Categories:</strong> {business.categories.map((category) => category.name).join(", ") || "None"}</p>
                  <Link className="button-link" to={`/businesses/${business.slug}`}>View storefront</Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
