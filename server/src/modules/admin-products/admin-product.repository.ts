import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { AdminProductRecord } from "./admin-product.types.js";

export async function listAdminProducts(input: { search?: string; status?: string; page: number; limit: number }) {
  const supabase = getSupabaseAdminClient();
  const { data: products, error } = await supabase.from("products")
    .select("id, business_id, category_id, name, slug, price, stock_quantity, status, created_at, updated_at, admin_status_reason, admin_status_changed_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load products: ${error.message}`);
  const rows = products ?? [];
  const businessIds = [...new Set(rows.map((r) => r.business_id as string))];
  const categoryIds = [...new Set(rows.map((r) => r.category_id as string))];
  const [{ data: businesses, error: businessError }, { data: categories, error: categoryError }] = await Promise.all([
    businessIds.length ? supabase.from("businesses").select("id, name, owner_id").in("id", businessIds) : Promise.resolve({ data: [], error: null }),
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [], error: null })
  ]);
  if (businessError) throw new Error(`Unable to load product businesses: ${businessError.message}`);
  if (categoryError) throw new Error(`Unable to load product categories: ${categoryError.message}`);
  const ownerIds = [...new Set((businesses ?? []).map((b) => b.owner_id as string))];
  const { data: profiles, error: profileError } = ownerIds.length ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds) : { data: [], error: null };
  if (profileError) throw new Error(`Unable to load product owners: ${profileError.message}`);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string]));
  const businessMap = new Map((businesses ?? []).map((b) => [b.id as string, b]));
  const categoryMap = new Map((categories ?? []).map((c) => [c.id as string, c.name as string]));
  const mapped: AdminProductRecord[] = rows.map((row) => {
    const business = businessMap.get(row.business_id as string);
    return {
      ...(row as any),
      business_name: business?.name as string ?? "Unknown business",
      owner_name: business ? profileMap.get(business.owner_id as string) ?? "Unknown owner" : "Unknown owner",
      category_name: categoryMap.get(row.category_id as string) ?? null
    };
  });
  const term = input.search?.toLowerCase();
  const filtered = mapped.filter((item) => {
    if (input.status && item.status !== input.status) return false;
    if (term && !`${item.name} ${item.business_name} ${item.owner_name}`.toLowerCase().includes(term)) return false;
    return true;
  });
  const start = (input.page - 1) * input.limit;
  return { items: filtered.slice(start, start + input.limit), page: input.page, limit: input.limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / input.limit)) };
}

export async function setAdminProductStatus(adminId: string, productId: string, action: "HIDE" | "RESTORE", reason: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("admin_set_product_status", { p_admin_id: adminId, p_product_id: productId, p_action: action, p_reason: reason || null });
  if (error) {
    if (error.message.includes("PRODUCT_NOT_FOUND")) throw new Error("PRODUCT_NOT_FOUND");
    if (error.message.includes("PRODUCT_REMOVED")) throw new Error("PRODUCT_REMOVED");
    throw new Error(`Unable to update product status: ${error.message}`);
  }
}
