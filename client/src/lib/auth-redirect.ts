const returnPathKey = "marketplace-oauth-return-path";
const authPaths = new Set(["/login", "/register", "/auth/callback", "/forgot-password", "/reset-password"]);

/** Only allow local app destinations; never follow an OAuth-supplied URL. */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\u0000-\u001f\u007f]/.test(value + decoded) || decoded.startsWith("//")) return "/";
    const url = new URL(value, "https://marketplace.invalid");
    if (url.origin !== "https://marketplace.invalid" || authPaths.has(decodeURIComponent(url.pathname).toLowerCase().replace(/\/+$/, ""))) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export function saveOAuthReturnPath(value: unknown) {
  try {
    sessionStorage.setItem(returnPathKey, safeReturnPath(value));
  } catch {
    // Signing in still works without storage; the destination falls back to home.
  }
}

export function readOAuthReturnPath(): string {
  try {
    return safeReturnPath(sessionStorage.getItem(returnPathKey));
  } catch {
    return "/";
  }
}

export function clearOAuthReturnPath() {
  try {
    sessionStorage.removeItem(returnPathKey);
  } catch {
    // Storage may be disabled in this browser.
  }
}

/** Display our own messages, rather than untrusted provider error descriptions. */
export function googleCallbackError(search: string, hash: string): string | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const error = query.get("error") || fragment.get("error");
  if (error === "access_denied") return "Google sign-in was cancelled or access was denied. You can try again or sign in with email.";
  if (error || query.has("error_code") || fragment.has("error_code") || query.has("error_description") || fragment.has("error_description")) {
    return "Google sign-in could not be completed. Please try again or sign in with email.";
  }
  return null;
}
