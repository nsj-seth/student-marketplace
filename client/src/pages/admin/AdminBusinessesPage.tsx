import { FormEvent, useEffect, useState } from "react";
import { Building2, ExternalLink, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminEmptyState, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAdminBusinesses,
  setAdminBusinessStatus,
  type AdminBusinessRecord,
  type BusinessStatus,
  type BusinessType
} from "../../services/admin-business.service";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

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
    setLoading(true);
    setError("");
    try {
      const response = await getAdminBusinesses({
        search: submittedSearch || undefined,
        status: status || undefined,
        businessType: businessType || undefined,
        page: nextPage,
        limit: 25
      });
      setItems(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.totalPages ?? 1);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load businesses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, [submittedSearch, status, businessType]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  async function confirmStatusChange() {
    if (!selected) return;
    const action = selected.status === "ACTIVE" ? "DISABLE" : "REACTIVATE";

    setSaving(true);
    setError("");
    try {
      await setAdminBusinessStatus(selected.id, action, action === "DISABLE" ? reason : "");
      setSelected(null);
      setReason("");
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update business.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <AdminPageHeader
        eyebrow="Admin management"
        title="Businesses"
        description="Inspect marketplace businesses, owners, listing status and product counts."
        icon={<Building2 className="size-3.5" />}
      />

      <form
        className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
        onSubmit={submitSearch}
      >
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Search
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Business, owner, email or location"
            />
          </div>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Status
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as "" | BusinessStatus)}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Type
          <select className={selectClass} value={businessType} onChange={(e) => setBusinessType(e.target.value as "" | BusinessType)}>
            <option value="">All</option>
            <option value="STUDENT_BUSINESS">Student</option>
            <option value="OTHER_BUSINESS">Other</option>
          </select>
        </label>

        <button data-ui="admin-business-search" type="submit" className="h-10 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Search
        </button>
      </form>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <p className="mt-5 text-sm text-muted-foreground">
        <strong className="text-foreground">{total}</strong> matching business{total === 1 ? "" : "es"}
      </p>

      {loading ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            icon={<Building2 className="size-6" />}
            title="No businesses found"
            description="No businesses match the current filters."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {items.map((business) => (
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm" key={business.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <strong className="block truncate text-lg">{business.name}</strong>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">
                    {business.owner_name} · {business.owner_email ?? "No email"}
                  </span>
                </div>
                <Badge variant={business.status === "ACTIVE" ? "success" : "destructive"}>
                  {business.status}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <strong className="mt-1 block text-sm">
                    {business.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}
                  </strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Products</span>
                  <strong className="mt-1 block text-sm">{business.product_count}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Availability</span>
                  <strong className="mt-1 block text-sm">{business.availability_status}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> Location
                  </span>
                  <strong className="mt-1 block text-sm">{business.location_text}</strong>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                <strong className="text-foreground">University:</strong> {business.university_name ?? "Not applicable"}
              </p>

              {business.admin_status_reason && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <strong>Admin reason:</strong> {business.admin_status_reason}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
                  to={"/businesses/" + business.slug}
                >
                  <ExternalLink className="size-3.5" />
                  Public storefront
                </Link>
                <button
                  data-ui="admin-business-status"
                  type="button"
                  onClick={() => { setSelected(business); setReason(""); }}
                  className={
                    "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold " +
                    (business.status === "ACTIVE"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700")
                  }
                >
                  {business.status === "ACTIVE" ? "Disable" : "Reactivate"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button data-ui="admin-business-prev" type="button" disabled={page <= 1} onClick={() => void load(page - 1)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button data-ui="admin-business-next" type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button>
        </div>
      )}

      {selected && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            {selected.status === "ACTIVE" ? "Disable" : "Reactivate"} {selected.name}
          </h2>
          {selected.status === "ACTIVE" ? (
            <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground">
              Reason
              <textarea
                data-ui="admin-business-reason"
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this business being disabled?"
                className="min-h-28 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </label>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This makes the storefront and eligible products public again. Seller-controlled availability is unchanged.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button data-ui="admin-business-confirm" type="button" disabled={saving || (selected.status === "ACTIVE" && reason.trim().length < 3)} onClick={() => void confirmStatusChange()} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Saving..." : "Confirm"}
            </button>
            <button data-ui="admin-business-cancel" type="button" disabled={saving} onClick={() => { setSelected(null); setReason(""); }} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
