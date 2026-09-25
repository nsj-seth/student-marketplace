import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { checkRoleAccess, type AppRole } from "../../services/role.service";

export function AccessPage({ role }: { role: AppRole }) {
  const [message, setMessage] = useState("Checking server-side permission...");

  useEffect(() => {
    void checkRoleAccess(role)
      .then((response) => setMessage(response.data?.message ?? "Access granted."))
      .catch((error: Error) => setMessage(error.message));
  }, [role]);

  return (
    <main className="page-shell">
      <section className="card">
        <span className="eyebrow">Phase 03</span>
        <h1>{role} area</h1>
        <p>{message}</p>
        <Link to="/">Back home</Link>
      </section>
    </main>
  );
}
