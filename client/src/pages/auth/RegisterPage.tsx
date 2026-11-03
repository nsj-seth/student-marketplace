import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { registerWithEmail } from "../../services/auth.service";

export function RegisterPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const { data, error: authError } = await registerWithEmail({
      fullName,
      email,
      password
    });
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage(
      data.session
        ? "Account created and signed in."
        : "Account created. Check your email and confirm your address before logging in."
    );
  }

  return (
    <AuthLayout
      eyebrow="Join the marketplace"
      title="One account for shopping and selling."
      description="Create your customer account now, then apply to become a seller whenever you're ready."
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.75rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-[.14em] text-primary">
            Create account
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Join Student Marketplace</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create your customer account in a few seconds.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Full name
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="pl-9"
                minLength={2}
                required
              />
            </div>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
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

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Password
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
            <span className="font-normal">Use at least 8 characters.</span>
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <button
          data-ui="auth-submit"
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          <UserPlus className="size-4" />
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link className="font-semibold text-primary" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
