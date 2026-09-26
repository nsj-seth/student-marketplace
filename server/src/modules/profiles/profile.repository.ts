import { getSupabaseAdminClient } from "../../lib/supabase.js";

export interface ProfileRecord {
  id: string;
  full_name: string;
  avatar_path: string | null;
  account_status?: "ACTIVE" | "SUSPENDED";
  created_at: string;
  updated_at: string;
}

export async function findProfileById(userId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_path, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  return data as ProfileRecord;
}

export async function updateProfileName(userId: string, fullName: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId)
    .select("id, full_name, avatar_path, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Unable to update profile: ${error.message}`);
  }

  return data as ProfileRecord;
}
