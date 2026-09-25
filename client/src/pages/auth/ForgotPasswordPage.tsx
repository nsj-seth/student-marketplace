import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordReset } from "../../services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const { error: resetError } = await sendPasswordReset(email);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("If that account exists, check the email inbox for the password reset link.");
  }

  return (
    <main className="page-shell">
      <form className="card form-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Account recovery</span>
        <h1>Reset password</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error && <p className="message message--error">{error}</p>}
        {message && <p className="message message--success">{message}</p>}
        <button type="submit">Send reset link</button>
        <p><Link to="/login">Back to login</Link></p>
      </form>
    </main>
  );
}
