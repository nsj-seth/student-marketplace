import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { CategoryRecord } from "./category.types.js";

const selectFields = "id, name, slug, description, is_active, created_at, updated_at";

export async function listActiveCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select(selectFields)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Unable to load categories: ${error.message}`);
  return (data ?? []) as CategoryRecord[];
}

export async function listAllCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select(selectFields)
    .order("name");

  if (error) throw new Error(`Unable to load categories: ${error.message}`);
  return (data ?? []) as CategoryRecord[];
}

export async function createCategoryRecord(input: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null
    })
    .select(selectFields)
    .single();

  if (error) throw new Error(`Unable to create category: ${error.message}`);
  return data as CategoryRecord;
}

export async function updateCategoryRecord(id: string, input: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select(selectFields)
    .maybeSingle();

  if (error) throw new Error(`Unable to update category: ${error.message}`);
  return data as CategoryRecord | null;
}
