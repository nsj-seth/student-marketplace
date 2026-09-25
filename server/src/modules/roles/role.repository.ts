import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { AppRole } from "./role.types.js";

interface UserRoleRecord {
  role: AppRole;
}

export async function findRolesByUserId(userId: string): Promise<AppRole[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .order("role");

  if (error) {
    throw new Error(`Unable to load user roles: ${error.message}`);
  }

  return ((data ?? []) as UserRoleRecord[]).map((entry) => entry.role);
}

// Internal-only helper. Do not expose this directly through a public route.
export async function grantRole(
  userId: string,
  role: AppRole,
  grantedBy: string | null = null
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role,
      granted_by: grantedBy
    },
    { onConflict: "user_id,role", ignoreDuplicates: true }
  );

  if (error) {
    throw new Error(`Unable to grant role: ${error.message}`);
  }
}
