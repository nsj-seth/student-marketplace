import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

function requireSupabaseConfig() {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured for authentication."
    );
  }
}

export function getSupabaseAuthClient() {
  requireSupabaseConfig();

  return createClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function getSupabaseAdminClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY must be configured on the server."
    );
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
