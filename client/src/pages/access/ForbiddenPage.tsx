import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <h1>Access denied</h1>
        <p>Your account does not have permission to open that page.</p>
        <Link to="/">Back home</Link>
      </section>
    </main>
  );
}
