import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { AdminBusinessRecord } from "./admin-business.types.js";

export async function listAdminBusinesses(input: { search?: string; status?: string; businessType?: string; page: number; limit: number }) {
  const supabase = getSupabaseAdminClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, owner_id, business_type, name, slug, description, university_id, location_text, contact_phone, status, availability_status, created_at, updated_at, admin_status_reason, admin_status_changed_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load businesses: ${error.message}`);

  const rows = businesses ?? [];
  const ownerIds = [...new Set(rows.map((row) => row.owner_id as string))];
  const universityIds = [...new Set(rows.map((row) => row.university_id as string | null).filter(Boolean) as string[])];
  const businessIds = rows.map((row) => row.id as string);

  const [{ data: profiles, error: profileError }, { data: universities, error: universityError }, { data: products, error: productsError }, authResult] = await Promise.all([
    ownerIds.length ? supabase.from("profiles").select("id, full_name").in("id", ownerIds) : Promise.resolve({ data: [], error: null }),
    universityIds.length ? supabase.from("universities").select("id, name").in("id", universityIds) : Promise.resolve({ data: [], error: null }),
    businessIds.length ? supabase.from("products").select("business_id").in("business_id", businessIds).neq("status", "REMOVED") : Promise.resolve({ data: [], error: null }),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  ]);

  if (profileError) throw new Error(`Unable to load business owners: ${profileError.message}`);
  if (universityError) throw new Error(`Unable to load universities: ${universityError.message}`);
  if (productsError) throw new Error(`Unable to count products: ${productsError.message}`);
  if (authResult.error) throw new Error(`Unable to load owner emails: ${authResult.error.message}`);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string]));
  const emailMap = new Map(authResult.data.users.map((u) => [u.id, u.email ?? null]));
  const universityMap = new Map((universities ?? []).map((u) => [u.id as string, u.name as string]));
  const productCount = new Map<string, number>();
  for (const product of products ?? []) productCount.set(product.business_id as string, (productCount.get(product.business_id as string) ?? 0) + 1);

  const mapped: AdminBusinessRecord[] = rows.map((row) => ({
    ...(row as any),
    owner_name: profileMap.get(row.owner_id as string) ?? "Unknown owner",
    owner_email: emailMap.get(row.owner_id as string) ?? null,
    university_name: row.university_id ? universityMap.get(row.university_id as string) ?? null : null,
    product_count: productCount.get(row.id as string) ?? 0
  }));

  const term = input.search?.toLowerCase();
  const filtered = mapped.filter((item) => {
    if (input.status && item.status !== input.status) return false;
    if (input.businessType && item.business_type !== input.businessType) return false;
    if (term) {
      const haystack = `${item.name} ${item.owner_name} ${item.owner_email ?? ""} ${item.location_text}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const start = (input.page - 1) * input.limit;
  return { items: filtered.slice(start, start + input.limit), page: input.page, limit: input.limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / input.limit)) };
}

export async function setAdminBusinessStatus(adminId: string, businessId: string, action: "DISABLE" | "REACTIVATE", reason: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("admin_set_business_status", { p_admin_id: adminId, p_business_id: businessId, p_action: action, p_reason: reason || null });
  if (error) {
    if (error.message.includes("BUSINESS_NOT_FOUND")) throw new Error("BUSINESS_NOT_FOUND");
    throw new Error(`Unable to update business status: ${error.message}`);
  }
}
