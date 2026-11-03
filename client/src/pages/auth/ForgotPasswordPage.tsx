import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordReset } from "../../services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    const { error: resetError } = await sendPasswordReset(email);
    if (resetError) { setError(resetError.message); return; }
    setMessage("If that account exists, check the email inbox for the password reset link.");
  }

  return (
    <main className="auth-page auth-page--compact">
      <section className="auth-showcase">
        <span className="auth-showcase__badge">Account recovery</span>
        <h1>Get back into your account.</h1>
        <p>We will send a secure password reset link to the email connected to your marketplace account.</p>
      </section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card__heading"><span className="eyebrow">Reset password</span><h2>Check your email</h2><p>Enter the email address you use to sign in.</p></div>
          <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          {error && <p className="message message--error">{error}</p>}
          {message && <p className="message message--success">{message}</p>}
          <button className="auth-submit" type="submit">Send reset link</button>
          <p className="auth-switch"><Link to="/login">← Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
