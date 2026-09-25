import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { updatePassword } from "../../services/auth.service";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    const { error: updateError } = await updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated successfully. You can continue using your account.");
  }

  return (
    <main className="page-shell">
      <form className="card form-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Account recovery</span>
        <h1>Choose a new password</h1>
        <label>
          New password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        {error && <p className="message message--error">{error}</p>}
        {message && <p className="message message--success">{message}</p>}
        <button type="submit">Update password</button>
        <p><Link to="/">Home</Link></p>
      </form>
    </main>
  );
}
