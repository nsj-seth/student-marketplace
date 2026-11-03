import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerWithEmail } from "../../services/auth.service";

export function RegisterPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const { data, error: authError } = await registerWithEmail({ fullName, email, password });
    setSubmitting(false);
    if (authError) { setError(authError.message); return; }
    setMessage(data.session ? "Account created and signed in." : "Account created. Check your email and confirm your address before logging in.");
  }

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-showcase">
        <span className="auth-showcase__badge">Join the marketplace</span>
        <h1>One account for shopping and selling.</h1>
        <p>Start as a customer, then apply to sell whenever you are ready. Your role grows with your account.</p>
        <div className="auth-showcase__points">
          <div><span>01</span><strong>Browse student and community businesses</strong></div>
          <div><span>02</span><strong>Save products and place multi-seller orders</strong></div>
          <div><span>03</span><strong>Apply for a seller account later</strong></div>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card__heading">
            <span className="eyebrow">Create account</span>
            <h2>Join Student Marketplace</h2>
            <p>Create your customer account in a few seconds.</p>
          </div>
          <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} required /></label>
          <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /><span>At least 8 characters.</span></label>
          {error && <p className="message message--error">{error}</p>}
          {message && <p className="message message--success">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</button>
          <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
