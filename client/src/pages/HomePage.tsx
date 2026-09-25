import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/auth.service";
import { getApiHealth } from "../services/health.service";

type ConnectionState = "checking" | "connected" | "failed";

export function HomePage() {
  const { user, loading } = useAuth();
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
        <span className="eyebrow">Phase 02</span>
        <h1>Student Marketplace</h1>
        <p>Authentication and application profiles are now connected to Supabase.</p>

        <div className={`status status--${connection}`}>
          <span className="status__dot" aria-hidden="true" />
          {label}
        </div>

        <div className="actions">
          {!loading && !user && (
            <>
              <Link className="button-link" to="/register">Register</Link>
              <Link className="button-link button-link--secondary" to="/login">Login</Link>
            </>
          )}

          {!loading && user && (
            <>
              <Link className="button-link" to="/profile">My profile</Link>
              <button type="button" className="secondary-button" onClick={() => void logout()}>
                Logout
              </button>
            </>
          )}
        </div>

        {user && <p className="account-line">Signed in as {user.email}</p>}
      </section>
    </main>
  );
}
