import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { UniversityRecord } from "./university.types.js";

const selectFields =
  "id, name, short_name, slug, country, is_active, created_at, updated_at";

export async function listActiveUniversities() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .select(selectFields)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Unable to load universities: ${error.message}`);
  return (data ?? []) as UniversityRecord[];
}

export async function listAllUniversities() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .select(selectFields)
    .order("name");

  if (error) throw new Error(`Unable to load universities: ${error.message}`);
  return (data ?? []) as UniversityRecord[];
}

export async function createUniversityRecord(input: {
  name: string;
  shortName?: string | null;
  slug: string;
  country: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .insert({
      name: input.name,
      short_name: input.shortName ?? null,
      slug: input.slug,
      country: input.country
    })
    .select(selectFields)
    .single();

  if (error) throw new Error(`Unable to create university: ${error.message}`);
  return data as UniversityRecord;
}

export async function updateUniversityRecord(
  id: string,
  input: Record<string, unknown>
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .update(input)
    .eq("id", id)
    .select(selectFields)
    .maybeSingle();

  if (error) throw new Error(`Unable to update university: ${error.message}`);
  return data as UniversityRecord | null;
}
