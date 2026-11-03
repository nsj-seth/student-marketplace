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

  if (user) return <Navigate to="/" replace />;

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
    <main className="auth-page">
      <section className="auth-showcase">
        <span className="auth-showcase__badge">Student Marketplace</span>
        <h1>Welcome back to your marketplace.</h1>
        <p>Discover products, track orders, manage your wishlist, or return to your seller workspace.</p>
        <div className="auth-showcase__points">
          <div><span>01</span><strong>Shop from verified campus and community sellers</strong></div>
          <div><span>02</span><strong>Track every seller in one multi-store order</strong></div>
          <div><span>03</span><strong>Manage your account securely in one place</strong></div>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card__heading">
            <span className="eyebrow">Sign in</span>
            <h2>Welcome back</h2>
            <p>Enter your account details to continue.</p>
          </div>
          <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <div className="auth-inline"><span /> <Link to="/forgot-password">Forgot password?</Link></div>
          {error && <p className="message message--error">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
          <p className="auth-switch">New to Student Marketplace? <Link to="/register">Create an account</Link></p>
        </form>
      </section>
    </main>
  );
}
