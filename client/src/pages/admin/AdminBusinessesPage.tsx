import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminBusinesses, setAdminBusinessStatus, type AdminBusinessRecord, type BusinessStatus, type BusinessType } from "../../services/admin-business.service";

export function AdminBusinessesPage() {
  const [items, setItems] = useState<AdminBusinessRecord[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<"" | BusinessStatus>("");
  const [businessType, setBusinessType] = useState<"" | BusinessType>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminBusinessRecord | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(nextPage = page) {
    setLoading(true); setError("");
    try {
      const response = await getAdminBusinesses({ search: submittedSearch || undefined, status: status || undefined, businessType: businessType || undefined, page: nextPage, limit: 25 });
      setItems(response.data?.items ?? []); setTotal(response.data?.total ?? 0); setTotalPages(response.data?.totalPages ?? 1); setPage(nextPage);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load businesses."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(1); }, [submittedSearch, status, businessType]);

  function submitSearch(event: FormEvent) { event.preventDefault(); setSubmittedSearch(search.trim()); }

  async function confirmStatusChange() {
    if (!selected) return;
    const action = selected.status === "ACTIVE" ? "DISABLE" : "REACTIVATE";
    setSaving(true); setError("");
    try {
      await setAdminBusinessStatus(selected.id, action, action === "DISABLE" ? reason : "");
      setSelected(null); setReason(""); await load(page);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update business."); }
    finally { setSaving(false); }
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Admin management</span>
        <h1>Businesses</h1>
        <p>Inspect marketplace businesses, owners, listing status, and product counts.</p>

        <form className="admin-user-filters" onSubmit={submitSearch}>
          <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Business, owner, email or location" /></label>
          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as "" | BusinessStatus)}><option value="">All</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option><option value="SUSPENDED">Suspended</option></select></label>
          <label>Type<select value={businessType} onChange={(e) => setBusinessType(e.target.value as "" | BusinessType)}><option value="">All</option><option value="STUDENT_BUSINESS">Student</option><option value="OTHER_BUSINESS">Other</option></select></label>
          <button type="submit">Search</button>
        </form>

        {error && <p className="message message--error">{error}</p>}
        <p><strong>{total}</strong> matching business{total === 1 ? "" : "es"}</p>
        {loading ? <p>Loading businesses...</p> : items.length === 0 ? <p>No businesses match these filters.</p> : (
          <div className="admin-user-list">
            {items.map((business) => (
              <article className="admin-user-card" key={business.id}>
                <div className="admin-user-card__heading">
                  <div><strong>{business.name}</strong><p>{business.owner_name} · {business.owner_email ?? "No email"}</p></div>
                  <span className={`status-chip ${business.status !== "ACTIVE" ? "status-chip--danger" : ""}`}>{business.status}</span>
                </div>
                <p><strong>Type:</strong> {business.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}</p>
                <p><strong>University:</strong> {business.university_name ?? "Not applicable"}</p>
                <p><strong>Location:</strong> {business.location_text}</p>
                <p><strong>Availability:</strong> {business.availability_status}</p>
                <p><strong>Products:</strong> {business.product_count}</p>
                {business.admin_status_reason && <p><strong>Admin reason:</strong> {business.admin_status_reason}</p>}
                <div className="actions">
                  <Link className="button-link button-link--secondary" to={`/businesses/${business.slug}`}>Public storefront</Link>
                  <button type="button" className={business.status === "ACTIVE" ? "danger-button" : undefined} onClick={() => { setSelected(business); setReason(""); }}>
                    {business.status === "ACTIVE" ? "Disable" : "Reactivate"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && <div className="pagination-row"><button type="button" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Next</button></div>}

        {selected && <section className="moderation-panel">
          <h2>{selected.status === "ACTIVE" ? "Disable" : "Reactivate"} {selected.name}</h2>
          {selected.status === "ACTIVE" ? <label>Reason<textarea value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} placeholder="Why is this business being disabled?" /></label> : <p>This makes the storefront and eligible products public again. Seller-controlled availability is unchanged.</p>}
          <div className="actions"><button type="button" disabled={saving || (selected.status === "ACTIVE" && reason.trim().length < 3)} onClick={() => void confirmStatusChange()}>{saving ? "Saving..." : "Confirm"}</button><button type="button" className="secondary-button" disabled={saving} onClick={() => { setSelected(null); setReason(""); }}>Cancel</button></div>
        </section>}

        <div className="actions"><Link className="button-link button-link--secondary" to="/admin/users">Users</Link><Link className="button-link button-link--secondary" to="/admin/products">Products</Link><Link className="button-link button-link--secondary" to="/admin/reports">Reports</Link></div>
      </section>
    </main>
  );
}
