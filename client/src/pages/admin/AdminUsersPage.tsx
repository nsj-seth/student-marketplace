import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    const targetStatus: AccountStatus = selected.account_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setSaving(true);
    setError("");
    try {
      await setAdminUserStatus(selected.id, targetStatus, targetStatus === "SUSPENDED" ? reason : "");
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
    <main className="wide-shell admin-management-page">
      <section className="card wide-card">
        <span className="eyebrow">Admin management</span>
        <h1>Users</h1>
        <p>Search accounts, inspect roles, and suspend or reactivate non-admin users.</p>

        <form className="admin-user-filters" onSubmit={submitSearch}>
          <label>
            Search
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as "" | AccountStatus)}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as "" | AppRole)}>
              <option value="">All</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SELLER">Seller</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button type="submit">Search</button>
        </form>

        {error && <p className="message message--error">{error}</p>}
        <p><strong>{total}</strong> matching user{total === 1 ? "" : "s"}</p>

        {loading ? <p>Loading users...</p> : users.length === 0 ? <p>No users match these filters.</p> : (
          <div className="admin-user-list">
            {users.map((account) => {
              const isAdmin = account.roles.includes("ADMIN");
              const isSelf = account.id === currentUser?.id;
              return (
                <article className="admin-user-card" key={account.id}>
                  <div className="admin-user-card__heading">
                    <div>
                      <strong>{account.full_name}</strong>
                      <p>{account.email ?? "No email available"}</p>
                    </div>
                    <span className={`status-chip ${account.account_status === "SUSPENDED" ? "status-chip--danger" : ""}`}>{account.account_status}</span>
                  </div>
                  <p><strong>Roles:</strong> {account.roles.join(", ") || "None"}</p>
                  <p><strong>Joined:</strong> {formatDate(account.created_at)}</p>
                  <p><strong>Last sign in:</strong> {formatDate(account.last_sign_in_at)}</p>
                  {account.suspension_reason && <p><strong>Suspension reason:</strong> {account.suspension_reason}</p>}
                  <div className="actions">
                    <button
                      type="button"
                      className={account.account_status === "ACTIVE" ? "danger-button" : undefined}
                      disabled={isAdmin || isSelf}
                      onClick={() => { setSelected(account); setReason(""); }}
                    >
                      {account.account_status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </button>
                    {(isAdmin || isSelf) && account.account_status === "ACTIVE" && <small>Admin accounts are protected from suspension.</small>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-row">
            <button type="button" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Next</button>
          </div>
        )}

        {selected && (
          <section className="moderation-panel">
            <h2>{selected.account_status === "ACTIVE" ? "Suspend" : "Reactivate"} {selected.full_name}</h2>
            {selected.account_status === "ACTIVE" ? (
              <label>
                Suspension reason
                <textarea value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} placeholder="Why is this account being suspended?" />
              </label>
            ) : (
              <p>The user will be able to authenticate again. Suspended businesses are not automatically reactivated.</p>
            )}
            <div className="actions">
              <button type="button" disabled={saving || (selected.account_status === "ACTIVE" && reason.trim().length < 3)} onClick={() => void confirmStatusChange()}>
                {saving ? "Saving..." : selected.account_status === "ACTIVE" ? "Confirm suspension" : "Reactivate account"}
              </button>
              <button type="button" className="secondary-button" disabled={saving} onClick={() => { setSelected(null); setReason(""); }}>Cancel</button>
            </div>
          </section>
        )}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">Home</Link>
          <Link className="button-link button-link--secondary" to="/admin/reports">Reports</Link>
        </div>
      </section>
    </main>
  );
}
