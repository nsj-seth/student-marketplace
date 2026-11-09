import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { updatePassword } from "../../services/auth.service";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated successfully. You can continue using your account.");
  }

  return (
    <AuthLayout
      eyebrow="Secure account"
      title="Choose a fresh password."
      description="Use a password you don't reuse elsewhere. Your marketplace data and orders stay connected to this account."
      points={[
        { title: "Use 8+ characters", description: "A longer password is easier to keep distinct from your other accounts." },
        { title: "Avoid reuse", description: "Choose something unique for Student Marketplace." },
        { title: "Keep your account", description: "Your orders, profile and seller access stay unchanged." }
      ]}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8"
      >
        <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">New password</span>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.025em]">Update your password</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose at least 8 characters.
        </p>

        <label className="mt-6 grid gap-1.5 text-xs font-semibold text-muted-foreground">
          New password
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-9 pr-10"
              minLength={8}
              required
            />
            <button
              data-ui="toggle-password"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        {error && (
          <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">{error}</div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">{message}</div>
        )}

        <button
          data-ui="auth-submit"
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50"
        >
          <CheckCircle2 className="size-4" />
          {submitting ? "Updating..." : "Update password"}
        </button>

        <Link className="mt-6 block text-center text-sm font-semibold text-primary-text" to="/">
          Return to marketplace
        </Link>
      </form>
    </AuthLayout>
  );
}
