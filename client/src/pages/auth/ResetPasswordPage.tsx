import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { updatePassword } from "../../services/auth.service";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    const { error: updateError } = await updatePassword(password);
    if (updateError) { setError(updateError.message); return; }
    setMessage("Password updated successfully. You can continue using your account.");
  }

  return (
    <main className="auth-page auth-page--compact">
      <section className="auth-showcase"><span className="auth-showcase__badge">Secure account</span><h1>Choose a fresh password.</h1><p>Use a password you do not reuse elsewhere. Your marketplace data and orders stay connected to this account.</p></section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card__heading"><span className="eyebrow">New password</span><h2>Update your password</h2><p>Choose at least 8 characters.</p></div>
          <label>New password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></label>
          {error && <p className="message message--error">{error}</p>}
          {message && <p className="message message--success">{message}</p>}
          <button className="auth-submit" type="submit">Update password</button>
          <p className="auth-switch"><Link to="/">Return to marketplace</Link></p>
        </form>
      </section>
    </main>
  );
}
