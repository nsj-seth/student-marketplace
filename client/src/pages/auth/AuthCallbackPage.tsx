import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { buttonVariants } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { initialOAuthError } from "../../lib/supabase";
import { clearOAuthReturnPath, googleCallbackError, readOAuthReturnPath } from "../../lib/auth-redirect";

export function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [destination] = useState(readOAuthReturnPath);
  const [providerError] = useState(() => initialOAuthError ?? googleCallbackError(window.location.search, window.location.hash));

  useEffect(() => {
    if (loading) return;
    clearOAuthReturnPath();
    // Discard provider parameters and tokens; never leave them in navigation history.
    window.history.replaceState(window.history.state, "", "/auth/callback");
    if (user && !providerError) navigate(destination, { replace: true });
  }, [loading, user, providerError, destination, navigate]);

  const failed = Boolean(providerError) || (!loading && !user);

  return (
    <AuthLayout eyebrow="Google sign-in" title="Welcome to your marketplace." description="Your purchases, saved products and business workspace are connected to your marketplace account.">
      <section aria-live="polite" className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {failed ? (
          <>
            <h2 className="text-2xl font-semibold text-foreground">Let's try signing in again</h2>
            <p role="alert" className="mt-4 text-sm leading-6 text-danger-foreground">
              {providerError || "We couldn't complete your sign-in. The sign-in link may have expired. Please start again."}
            </p>
            <Link className={`mt-6 ${buttonVariants()}`} to="/login" state={{ from: destination }}>Return to sign in</Link>
          </>
        ) : (
          <div role="status" className="flex items-center gap-3 text-foreground">
            <LoaderCircle className="size-5 shrink-0 animate-spin text-primary-text" aria-hidden="true" />
            <p className="text-sm text-foreground">Finishing your sign-in…</p>
          </div>
        )}
      </section>
    </AuthLayout>
  );
}
