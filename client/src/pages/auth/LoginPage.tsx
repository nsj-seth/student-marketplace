import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { GoogleSignIn } from "../../components/auth/GoogleSignIn";
import { safeReturnPath } from "../../lib/auth-redirect";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { loginWithEmail } from "../../services/auth.service";

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  const destination = safeReturnPath((location.state as { from?: string } | null)?.from);
  if (user && !loading) return <Navigate to={destination} replace />;

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

    navigate(destination, { replace: true });
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Everything you need, one account away."
      description="Sign in to shop, track orders, manage your wishlist, or return to your seller workspace."
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">
            Sign in
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.025em]">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your account details to continue.
          </p>
        </div>

        <GoogleSignIn returnTo={destination} disabled={submitting || loading} onPendingChange={setGooglePending} />

        <div className="mt-6 space-y-4">
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Email address
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-9"
                placeholder="you@example.com"
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
                required
              />
              <button
                data-ui="toggle-password"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
        </div>

        <div className="mt-3 flex justify-end">
          <Link className="text-xs font-semibold text-primary-text" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            {error}
          </div>
        )}

        <button
          data-ui="auth-submit"
          type="submit"
          disabled={submitting || loading || googlePending}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:saturate-50"
        >
          <ShieldCheck className="size-4" />
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Student Marketplace?{" "}
          <Link className="font-semibold text-primary-text" to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
