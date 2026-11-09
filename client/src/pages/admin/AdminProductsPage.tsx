import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Search, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminEmptyState, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAdminProducts,
  setAdminProductStatus,
  type AdminProductRecord,
  type ProductStatus
} from "../../services/admin-product.service";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

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
    setLoading(true);
    setError("");
    try {
      const response = await getAdminProducts({
        search: submittedSearch || undefined,
        status: status || undefined,
        page: nextPage,
        limit: 25
      });
      setItems(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.totalPages ?? 1);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, [submittedSearch, status]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  async function confirmStatusChange() {
    if (!selected) return;
    const action = selected.status === "HIDDEN" ? "RESTORE" : "HIDE";

    setSaving(true);
    setError("");
    try {
      await setAdminProductStatus(selected.id, action, action === "HIDE" ? reason : "");
      setSelected(null);
      setReason("");
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <AdminPageHeader
        eyebrow="Admin management"
        title="Products"
        description="Search marketplace products and hide or restore listings without deleting order history."
        icon={<ShoppingBag className="size-3.5" />}
      />

      <form
        className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]"
        onSubmit={submitSearch}
      >
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Search
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Product, business or owner" />
          </div>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Status
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as "" | ProductStatus)}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
            <option value="HIDDEN">Hidden</option>
            <option value="REMOVED">Removed</option>
          </select>
        </label>

        <button data-ui="admin-product-search" type="submit" className="h-10 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Search</button>
      </form>

      {error && <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">{error}</div>}

      <p className="mt-5 text-sm text-muted-foreground">
        <strong className="text-foreground">{total}</strong> matching product{total === 1 ? "" : "s"}
      </p>

      {loading ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState icon={<ShoppingBag className="size-6" />} title="No products found" description="No product listings match the current filters." />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {items.map((product) => (
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm" key={product.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <strong className="block truncate text-lg">{product.name}</strong>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">{product.business_name} · {product.owner_name}</span>
                </div>
                <Badge variant={product.status === "HIDDEN" || product.status === "REMOVED" ? "destructive" : product.status === "OUT_OF_STOCK" ? "warning" : "success"}>
                  {product.status.replaceAll("_", " ")}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <strong className="mt-1 block text-sm">{product.category_name ?? "—"}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Price</span>
                  <strong className="mt-1 block text-sm">GH₵{Number(product.price).toFixed(2)}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Stock</span>
                  <strong className="mt-1 block text-sm">{product.stock_quantity}</strong>
                </div>
              </div>

              {product.admin_status_reason && (
                <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger-foreground">
                  <strong>Admin reason:</strong> {product.admin_status_reason}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
                  to={"/products/" + product.id + "/" + product.slug}
                >
                  <ExternalLink className="size-3.5" />
                  Public product
                </Link>

                {product.status !== "REMOVED" && (
                  <button
                    data-ui="admin-product-status"
                    type="button"
                    onClick={() => { setSelected(product); setReason(""); }}
                    className={
                      "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold " +
                      (product.status !== "HIDDEN"
                        ? "border-danger-border bg-danger-soft text-danger-foreground"
                        : "border-success-border bg-success-soft text-success-foreground")
                    }
                  >
                    {product.status === "HIDDEN" ? "Restore" : "Hide"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button data-ui="admin-products-prev" type="button" disabled={page <= 1} onClick={() => void load(page - 1)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:saturate-50">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button data-ui="admin-products-next" type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:saturate-50">Next</button>
        </div>
      )}

      {selected && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{selected.status === "HIDDEN" ? "Restore" : "Hide"} {selected.name}</h2>
          {selected.status !== "HIDDEN" ? (
            <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground">
              Reason
              <textarea
                data-ui="admin-product-reason"
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this product being hidden?"
                className="min-h-28 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </label>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              The product will return to its previous seller-controlled status where possible.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button data-ui="admin-product-confirm" type="button" disabled={saving || (selected.status !== "HIDDEN" && reason.trim().length < 3)} onClick={() => void confirmStatusChange()} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50">
              {saving ? "Saving..." : "Confirm"}
            </button>
            <button data-ui="admin-product-cancel" type="button" disabled={saving} onClick={() => { setSelected(null); setReason(""); }} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">Cancel</button>
          </div>
        </section>
      )}
    </main>
  );
}
