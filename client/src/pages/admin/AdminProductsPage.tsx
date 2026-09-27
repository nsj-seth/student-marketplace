import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminProducts, setAdminProductStatus, type AdminProductRecord, type ProductStatus } from "../../services/admin-product.service";

export function AdminProductsPage() {
  const [items, setItems] = useState<AdminProductRecord[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<"" | ProductStatus>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminProductRecord | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(nextPage = page) {
    setLoading(true); setError("");
    try {
      const response = await getAdminProducts({ search: submittedSearch || undefined, status: status || undefined, page: nextPage, limit: 25 });
      setItems(response.data?.items ?? []); setTotal(response.data?.total ?? 0); setTotalPages(response.data?.totalPages ?? 1); setPage(nextPage);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load products."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(1); }, [submittedSearch, status]);
  function submitSearch(event: FormEvent) { event.preventDefault(); setSubmittedSearch(search.trim()); }

  async function confirmStatusChange() {
    if (!selected) return;
    const action = selected.status === "HIDDEN" ? "RESTORE" : "HIDE";
    setSaving(true); setError("");
    try { await setAdminProductStatus(selected.id, action, action === "HIDE" ? reason : ""); setSelected(null); setReason(""); await load(page); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update product."); }
    finally { setSaving(false); }
  }

  return (
    <main className="wide-shell"><section className="card wide-card">
      <span className="eyebrow">Admin management</span><h1>Products</h1><p>Search marketplace products and hide or restore listings without deleting order history.</p>
      <form className="admin-product-filters" onSubmit={submitSearch}>
        <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product, business or owner" /></label>
        <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as "" | ProductStatus)}><option value="">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="OUT_OF_STOCK">Out of stock</option><option value="HIDDEN">Hidden</option><option value="REMOVED">Removed</option></select></label>
        <button type="submit">Search</button>
      </form>
      {error && <p className="message message--error">{error}</p>}<p><strong>{total}</strong> matching product{total === 1 ? "" : "s"}</p>
      {loading ? <p>Loading products...</p> : items.length === 0 ? <p>No products match these filters.</p> : <div className="admin-user-list">
        {items.map((product) => <article className="admin-user-card" key={product.id}>
          <div className="admin-user-card__heading"><div><strong>{product.name}</strong><p>{product.business_name} · {product.owner_name}</p></div><span className={`status-chip ${product.status === "HIDDEN" || product.status === "REMOVED" ? "status-chip--danger" : ""}`}>{product.status}</span></div>
          <p><strong>Category:</strong> {product.category_name ?? "—"}</p><p><strong>Price:</strong> GH₵{Number(product.price).toFixed(2)}</p><p><strong>Stock:</strong> {product.stock_quantity}</p>
          {product.admin_status_reason && <p><strong>Admin reason:</strong> {product.admin_status_reason}</p>}
          <div className="actions"><Link className="button-link button-link--secondary" to={`/products/${product.id}/${product.slug}`}>Public product</Link>{product.status !== "REMOVED" && <button type="button" className={product.status !== "HIDDEN" ? "danger-button" : undefined} onClick={() => { setSelected(product); setReason(""); }}>{product.status === "HIDDEN" ? "Restore" : "Hide"}</button>}</div>
        </article>)}
      </div>}
      {totalPages > 1 && <div className="pagination-row"><button type="button" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Next</button></div>}
      {selected && <section className="moderation-panel"><h2>{selected.status === "HIDDEN" ? "Restore" : "Hide"} {selected.name}</h2>{selected.status !== "HIDDEN" ? <label>Reason<textarea value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} placeholder="Why is this product being hidden?" /></label> : <p>The product will return to its previous seller-controlled status where possible.</p>}<div className="actions"><button type="button" disabled={saving || (selected.status !== "HIDDEN" && reason.trim().length < 3)} onClick={() => void confirmStatusChange()}>{saving ? "Saving..." : "Confirm"}</button><button type="button" className="secondary-button" disabled={saving} onClick={() => { setSelected(null); setReason(""); }}>Cancel</button></div></section>}
      <div className="actions"><Link className="button-link button-link--secondary" to="/admin/users">Users</Link><Link className="button-link button-link--secondary" to="/admin/businesses">Businesses</Link><Link className="button-link button-link--secondary" to="/admin/reports">Reports</Link></div>
    </section></main>
  );
}
