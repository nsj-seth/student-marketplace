import { getSupabaseAdminClient } from "../../lib/supabase.js";

const publicBusinessFields = [
  "id",
  "business_type",
  "name",
  "slug",
  "description",
  "university_id",
  "location_text",
  "contact_phone",
  "social_links",
  "pickup_enabled",
  "seller_delivery_enabled",
  "logo_path",
  "availability_status",
  "approved_at",
  "created_at",
  "updated_at"
].join(", ");

type PublicBusinessRecord = {
  id: string;
  business_type: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
  name: string;
  slug: string;
  description: string;
  university_id: string | null;
  location_text: string;
  contact_phone: string;
  social_links: Record<string, string> | null;
  pickup_enabled: boolean;
  seller_delivery_enabled: boolean;
  logo_path: string | null;
  availability_status: "OPEN" | "UNAVAILABLE";
  approved_at: string;
  created_at: string;
  updated_at: string;
};

async function attachPublicRelations(rows: PublicBusinessRecord[]) {
  if (rows.length === 0) return [];

  const supabase = getSupabaseAdminClient();
  const businessIds = rows.map((row) => row.id);
  const universityIds = [...new Set(rows.map((row) => row.university_id).filter(Boolean))] as string[];

  const { data: categoryRows, error: categoryError } = await supabase
    .from("business_categories")
    .select("business_id, category_id, categories(id, name, slug, is_active)")
    .in("business_id", businessIds);

  if (categoryError) {
    throw new Error(`Unable to load public business categories: ${categoryError.message}`);
  }

  let universityRows: Array<{ id: string; name: string; short_name: string | null; slug: string }> = [];
  if (universityIds.length) {
    const { data, error } = await supabase
      .from("universities")
      .select("id, name, short_name, slug")
      .in("id", universityIds);

    if (error) {
      throw new Error(`Unable to load public business universities: ${error.message}`);
    }
    universityRows = (data ?? []) as typeof universityRows;
  }

  const categoryMap = new Map<string, Array<{ id: string; name: string; slug: string }>>();
  for (const relation of categoryRows ?? []) {
    const raw = relation.categories as unknown;
    const category = (Array.isArray(raw) ? raw[0] : raw) as
      | { id: string; name: string; slug: string; is_active: boolean }
      | null;

    if (!category || !category.is_active) continue;
    const list = categoryMap.get(relation.business_id as string) ?? [];
    list.push({ id: category.id, name: category.name, slug: category.slug });
    categoryMap.set(relation.business_id as string, list);
  }

  const universityMap = new Map(universityRows.map((row) => [row.id, row]));

  return rows.map((row) => ({
    ...row,
    social_links: row.social_links ?? {},
    categories: categoryMap.get(row.id) ?? [],
    university: row.university_id ? universityMap.get(row.university_id) ?? null : null
  }));
}

export async function listPublicBusinesses(filters: {
  search?: string;
  category?: string;
  university?: string;
  businessType?: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
  availability?: "OPEN" | "UNAVAILABLE";
}) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("businesses")
    .select(publicBusinessFields)
    .eq("status", "ACTIVE")
    .order("approved_at", { ascending: false });

  if (filters.search) {
    const safeSearch = filters.search.replace(/[%_,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
    }
  }

  if (filters.businessType) query = query.eq("business_type", filters.businessType);
  if (filters.availability) query = query.eq("availability_status", filters.availability);
  if (filters.university) query = query.eq("university_id", filters.university);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load public businesses: ${error.message}`);

  let businesses = await attachPublicRelations((data ?? []) as PublicBusinessRecord[]);

  if (filters.category) {
    businesses = businesses.filter((business) =>
      business.categories.some((category) => category.id === filters.category || category.slug === filters.category)
    );
  }

  return businesses;
}

export async function findPublicBusinessBySlug(slug: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(publicBusinessFields)
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw new Error(`Unable to load public business: ${error.message}`);
  if (!data) return null;

  const [business] = await attachPublicRelations([data as PublicBusinessRecord]);
  return business ?? null;
}
