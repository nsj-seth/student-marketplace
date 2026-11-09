import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Package, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminEmptyState, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAdminOrders,
  type AdminOrderListItem,
  type OrderDisplayStatus,
  type SellerOrderStatus
} from "../../services/admin-order.service";

function money(value: number) {
  return "GH₵" + value.toFixed(2);
}

function dateTime(value: string) {
  return new Date(value).toLocaleString();
}

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

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
    setLoading(true);
    setError("");
    try {
      const response = await getAdminOrders({
        search: submittedSearch || undefined,
        displayStatus: displayStatus || undefined,
        sellerStatus: sellerStatus || undefined,
        page: nextPage,
        limit: 25
      });
      setItems(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.totalPages ?? 1);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, [submittedSearch, displayStatus, sellerStatus]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <AdminPageHeader
        eyebrow="Admin management"
        title="Orders"
        description="Inspect every marketplace order and its seller-specific fulfilment progress."
        icon={<Package className="size-3.5" />}
      />

      <form
        className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_200px_220px_auto]"
        onSubmit={submitSearch}
      >
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Search
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Order, customer, phone or business" />
          </div>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Overall status
          <select className={selectClass} value={displayStatus} onChange={(e) => setDisplayStatus(e.target.value as "" | OrderDisplayStatus)}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="PARTIALLY_COMPLETED">Partially completed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Seller-order status
          <select className={selectClass} value={sellerStatus} onChange={(e) => setSellerStatus(e.target.value as "" | SellerOrderStatus)}>
            <option value="">All</option>
            {["PENDING","ACCEPTED","PREPARING","READY","OUT_FOR_DELIVERY","COMPLETED","REJECTED","CANCELLED"].map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>

        <button data-ui="admin-order-search" type="submit" className="h-10 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Search</button>
      </form>

      {error && <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">{error}</div>}

      <p className="mt-5 text-sm text-muted-foreground">
        <strong className="text-foreground">{total}</strong> matching order{total === 1 ? "" : "s"}
      </p>

      {loading ? (
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState icon={<Package className="size-6" />} title="No orders found" description="No marketplace orders match the current filters." />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((order) => (
            <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" key={order.id}>
              <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">{dateTime(order.created_at)}</span>
                  <h2 className="mt-1 text-lg font-semibold">{order.order_number}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{order.customer_name} · {order.customer_phone}</p>
                </div>
                <Badge variant="secondary">{order.display_status.replaceAll("_", " ")}</Badge>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <strong className="mt-1 block text-sm">{money(order.total)}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Seller orders</span>
                  <strong className="mt-1 block text-sm">{order.seller_order_count}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Businesses</span>
                  <strong className="mt-1 block text-sm">{order.business_names.join(", ") || "—"}</strong>
                </div>
              </div>

              <div className="flex justify-end border-t border-border bg-muted/20 p-4">
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  to={"/admin/orders/" + order.id}
                >
                  View order <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button data-ui="admin-orders-prev" type="button" disabled={page <= 1} onClick={() => void load(page - 1)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:saturate-50">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button data-ui="admin-orders-next" type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:saturate-50">Next</button>
        </div>
      )}
    </main>
  );
}
