import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { signInWithGoogle } from "../../services/auth.service";

export const googleSignInEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";

export function GoogleSignIn({ returnTo = "/", disabled = false, onPendingChange }: { returnTo?: string; disabled?: boolean; onPendingChange?: (pending: boolean) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!googleSignInEnabled) return null;

  async function signIn() {
    if (pending) return;
    setError("");
    setPending(true);
    onPendingChange?.(true);
    try {
      const { error: authError } = await signInWithGoogle(returnTo);
      if (authError) throw authError;
      // On success the browser leaves for Google. Keep the button disabled.
    } catch {
      setError("We couldn't start Google sign-in. Please try again or use your email and password.");
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        data-ui="google-sign-in"
        type="button"
        className="google-sign-in"
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={() => void signIn()}
      >
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : (
          <span className="grid size-6 place-items-center rounded-sm bg-white" aria-hidden="true">
            <img src="/google-logo.png" width="20" height="20" className="h-5 w-auto" alt="" />
          </span>
        )}
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p role="alert" className="mt-3 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger-foreground">{error}</p>}
      <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span>or continue with email</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  );
}
