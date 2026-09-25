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

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const { data, error: authError } = await registerWithEmail({ fullName, email, password });
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      setMessage("Account created and signed in.");
    } else {
      setMessage("Account created. Check your email and confirm your address before logging in.");
    }
  }

  return (
    <main className="page-shell">
      <form className="card form-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Account</span>
        <h1>Create account</h1>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        {error && <p className="message message--error">{error}</p>}
        {message && <p className="message message--success">{message}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
