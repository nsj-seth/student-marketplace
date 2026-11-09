import { createClient } from "@supabase/supabase-js";
import { googleCallbackError } from "./auth-redirect";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Check client/.env."
  );
}

// Capture errors before the SDK processes (and cleans) an OAuth callback URL.
export const initialOAuthError = window.location.pathname === "/auth/callback"
  ? googleCallbackError(window.location.search, window.location.hash)
  : null;

// Retain the existing browser flow so email confirmation and password recovery
// continue to work across browsers. Supabase consumes OAuth tokens from the URL.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: "implicit", detectSessionInUrl: true }
});
