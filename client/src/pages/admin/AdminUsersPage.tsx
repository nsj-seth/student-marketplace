import { FormEvent, useEffect, useState } from "react";
import { Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { AdminEmptyState, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminUsers,
  setAdminUserStatus,
  type AccountStatus,
  type AdminUserRecord,
  type AppRole
} from "../../services/admin-user.service";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<"" | AccountStatus>("");
  const [role, setRole] = useState<"" | AppRole>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminUserRecord | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminUsers({
        search: submittedSearch || undefined,
        status: status || undefined,
        role: role || undefined,
        page: nextPage,
        limit: 25
      });
      setUsers(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.totalPages ?? 1);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, [submittedSearch, status, role]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  async function confirmStatusChange() {
    if (!selected) return;
    const targetStatus: AccountStatus =
      selected.account_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setSaving(true);
    setError("");
    try {
      await setAdminUserStatus(
        selected.id,
        targetStatus,
        targetStatus === "SUSPENDED" ? reason : ""
      );
      setSelected(null);
      setReason("");
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <AdminPageHeader
        eyebrow="Admin management"
        title="Users"
        description="Search accounts, inspect roles, and suspend or reactivate non-admin users."
        icon={<Users className="size-3.5" />}
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
              placeholder="Name or email"
            />
          </div>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Status
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as "" | AccountStatus)}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Role
          <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as "" | AppRole)}>
            <option value="">All</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <button
          data-ui="admin-user-search"
          type="submit"
          className="h-10 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          <strong className="text-foreground">{total}</strong> matching user{total === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            icon={<Users className="size-6" />}
            title="No users found"
            description="No accounts match the current filters."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {users.map((account) => {
            const isAdmin = account.roles.includes("ADMIN");
            const isSelf = account.id === currentUser?.id;
            return (
              <article key={account.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary-text">
                      {(account.full_name?.[0] ?? account.email?.[0] ?? "U").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-base">{account.full_name}</strong>
                      <span className="block truncate text-sm text-muted-foreground">{account.email ?? "No email available"}</span>
                    </div>
                  </div>
                  <Badge variant={account.account_status === "SUSPENDED" ? "destructive" : "success"}>
                    {account.account_status}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Roles</span>
                    <strong className="mt-1 block text-sm">{account.roles.join(", ") || "None"}</strong>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Joined</span>
                    <strong className="mt-1 block text-sm">{formatDate(account.created_at)}</strong>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Last sign in</span>
                    <strong className="mt-1 block text-sm">{formatDate(account.last_sign_in_at)}</strong>
                  </div>
                </div>

                {account.suspension_reason && (
                  <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger-foreground">
                    <strong>Suspension reason:</strong> {account.suspension_reason}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                  {(isAdmin || isSelf) && account.account_status === "ACTIVE" ? (
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-success-foreground" />
                      Admin accounts are protected from suspension.
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Account moderation</span>
                  )}
                  <button
                    data-ui="admin-user-status"
                    type="button"
                    disabled={isAdmin || isSelf}
                    onClick={() => { setSelected(account); setReason(""); }}
                    className={
                      "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold disabled:saturate-50 " +
                      (account.account_status === "ACTIVE"
                        ? "border-danger-border bg-danger-soft text-danger-foreground"
                        : "border-success-border bg-success-soft text-success-foreground")
                    }
                  >
                    {account.account_status === "ACTIVE" ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button
            data-ui="admin-users-prev"
            type="button"
            disabled={page <= 1}
            onClick={() => void load(page - 1)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold disabled:saturate-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            data-ui="admin-users-next"
            type="button"
            disabled={page >= totalPages}
            onClick={() => void load(page + 1)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold disabled:saturate-50"
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
              <UserRound className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">
                {selected.account_status === "ACTIVE" ? "Suspend" : "Reactivate"} {selected.full_name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm the account-status change below.
              </p>
            </div>
          </div>

          {selected.account_status === "ACTIVE" ? (
            <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground">
              Suspension reason
              <textarea
                data-ui="admin-user-reason"
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this account being suspended?"
                className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </label>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The user will be able to authenticate again. Suspended businesses are not automatically reactivated.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              data-ui="admin-user-confirm"
              type="button"
              disabled={saving || (selected.account_status === "ACTIVE" && reason.trim().length < 3)}
              onClick={() => void confirmStatusChange()}
              className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50"
            >
              {saving ? "Saving..." : selected.account_status === "ACTIVE" ? "Confirm suspension" : "Reactivate account"}
            </button>
            <button
              data-ui="admin-user-cancel"
              type="button"
              disabled={saving}
              onClick={() => { setSelected(null); setReason(""); }}
              className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
