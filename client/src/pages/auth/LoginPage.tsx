import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginWithEmail } from "../../services/auth.service";

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: authError } = await loginWithEmail(email, password);
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
  }

  return (
    <main className="page-shell">
      <form className="card form-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Account</span>
        <h1>Login</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="message message--error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
        <p><Link to="/forgot-password">Forgot password?</Link></p>
        <p>Need an account? <Link to="/register">Register</Link></p>
      </form>
    </main>
  );
}
