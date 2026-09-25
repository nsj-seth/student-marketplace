import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/auth.service";
import { getApiHealth } from "../services/health.service";

type ConnectionState = "checking" | "connected" | "failed";

export function HomePage() {
  const { user, roles, loading } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>("checking");

  useEffect(() => {
    let active = true;

    async function checkApi() {
      try {
        const response = await getApiHealth();
        if (active) {
          setConnection(response.data?.status === "ok" ? "connected" : "failed");
        }
      } catch {
        if (active) setConnection("failed");
      }
    }

    void checkApi();
    return () => {
      active = false;
    };
  }, []);

  const label =
    connection === "checking"
      ? "Checking API..."
      : connection === "connected"
        ? "API connected"
        : "API connection failed";

  return (
    <main className="page-shell">
      <section className="card">
        <span className="eyebrow">Phase 06</span>
        <h1>Student Marketplace</h1>
        <p>Seller applications can now be reviewed by admins. Approved applicants receive a real business and SELLER access.</p>

        <div className={`status status--${connection}`}>
          <span className="status__dot" aria-hidden="true" />
          {label}
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/reference-data">
            Universities & categories
          </Link>

          {!loading && !user && (
            <>
              <Link className="button-link" to="/register">Register</Link>
              <Link className="button-link button-link--secondary" to="/login">Login</Link>
            </>
          )}

          {!loading && user && (
            <>
              <Link className="button-link" to="/profile">My profile</Link>
              <Link className="button-link" to="/sell">Become a seller</Link>
              <Link className="button-link button-link--secondary" to="/customer-test">Customer test</Link>
              {roles.includes("SELLER") && <Link to="/seller-test">Seller test</Link>}
              {roles.includes("ADMIN") && (
                <>
                  <Link to="/admin-test">Admin test</Link>
                  <Link to="/admin/reference-data">Manage reference data</Link>
                  <Link to="/admin/seller-applications">Review seller applications</Link>
                </>
              )}
              <button type="button" className="secondary-button" onClick={() => void logout()}>
                Logout
              </button>
            </>
          )}
        </div>

        {user && (
          <>
            <p className="account-line">Signed in as {user.email}</p>
            <p className="account-line">Roles: {roles.length ? roles.join(", ") : "None"}</p>
          </>
        )}
      </section>
    </main>
  );
}
