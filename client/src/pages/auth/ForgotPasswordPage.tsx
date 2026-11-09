import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { sendPasswordReset } from "../../services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const { error: resetError } = await sendPasswordReset(email);
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("If that account exists, check the email inbox for the password reset link.");
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Get back into your account securely."
      description="We'll send a password reset link to the email connected to your marketplace account."
      points={[
        { title: "Secure recovery", description: "Password reset links are sent only through your account email." },
        { title: "Keep your history", description: "Your orders, wishlist and seller data remain connected." },
        { title: "Return quickly", description: "Once reset, you can sign back in and continue where you left off." }
      ]}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8"
      >
        <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">
          Reset password
        </span>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.025em]">Check your email</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the email address you use to sign in.
        </p>

        <label className="mt-6 grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Email address
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-9"
              required
            />
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
          <Send className="size-4" />
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        <Link className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-primary-text" to="/login">
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
