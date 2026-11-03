import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders, type AdminOrderListItem, type OrderDisplayStatus, type SellerOrderStatus } from "../../services/admin-order.service";

function money(value: number) { return `GH₵${value.toFixed(2)}`; }
function dateTime(value: string) { return new Date(value).toLocaleString(); }

export function AdminOrdersPage() {
  const [items, setItems] = useState<AdminOrderListItem[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [displayStatus, setDisplayStatus] = useState<"" | OrderDisplayStatus>("");
  const [sellerStatus, setSellerStatus] = useState<"" | SellerOrderStatus>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextPage = page) {
    setLoading(true); setError("");
    try {
      const response = await getAdminOrders({ search: submittedSearch || undefined, displayStatus: displayStatus || undefined, sellerStatus: sellerStatus || undefined, page: nextPage, limit: 25 });
      setItems(response.data?.items ?? []); setTotal(response.data?.total ?? 0); setTotalPages(response.data?.totalPages ?? 1); setPage(nextPage);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load orders."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(1); }, [submittedSearch, displayStatus, sellerStatus]);
  function submitSearch(event: FormEvent) { event.preventDefault(); setSubmittedSearch(search.trim()); }

  return <main className="wide-shell admin-management-page"><section className="card wide-card">
    <span className="eyebrow">Admin management</span><h1>Orders</h1><p>Inspect every marketplace order and its seller-specific fulfilment progress.</p>
    <form className="admin-user-filters" onSubmit={submitSearch}>
      <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order, customer, phone or business" /></label>
      <label>Overall status<select value={displayStatus} onChange={(e) => setDisplayStatus(e.target.value as "" | OrderDisplayStatus)}><option value="">All</option><option value="PENDING">Pending</option><option value="IN_PROGRESS">In progress</option><option value="PARTIALLY_COMPLETED">Partially completed</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label>
      <label>Seller-order status<select value={sellerStatus} onChange={(e) => setSellerStatus(e.target.value as "" | SellerOrderStatus)}><option value="">All</option>{["PENDING","ACCEPTED","PREPARING","READY","OUT_FOR_DELIVERY","COMPLETED","REJECTED","CANCELLED"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label>
      <button type="submit">Search</button>
    </form>
    {error && <p className="message message--error">{error}</p>}
    <p><strong>{total}</strong> matching order{total === 1 ? "" : "s"}</p>
    {loading ? <p>Loading orders...</p> : items.length === 0 ? <p>No orders match these filters.</p> : <div className="admin-user-list">{items.map((order) => <article className="admin-user-card" key={order.id}>
      <div className="admin-user-card__heading"><div><strong>{order.order_number}</strong><p>{order.customer_name} · {order.customer_phone}</p></div><span className="status-chip">{order.display_status.replaceAll("_", " ")}</span></div>
      <p><strong>Total:</strong> {money(order.total)}</p><p><strong>Businesses:</strong> {order.business_names.join(", ") || "—"}</p><p><strong>Seller orders:</strong> {order.seller_order_count}</p><p><strong>Placed:</strong> {dateTime(order.created_at)}</p>
      <Link className="button-link" to={`/admin/orders/${order.id}`}>View order</Link>
    </article>)}</div>}
    {totalPages > 1 && <div className="pagination-row"><button type="button" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Next</button></div>}
    <div className="actions"><Link className="button-link button-link--secondary" to="/admin/users">Users</Link><Link className="button-link button-link--secondary" to="/admin/businesses">Businesses</Link><Link className="button-link button-link--secondary" to="/admin/products">Products</Link><Link className="button-link button-link--secondary" to="/admin/reports">Reports</Link></div>
  </section></main>;
}
