import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { MarketplaceManagementData } from "./admin-marketplace.types.js";

export async function getMarketplaceManagementData(): Promise<MarketplaceManagementData> {
  const supabase = getSupabaseAdminClient();
  const [{ data: businesses, error: businessError }, { data: products, error: productError }] = await Promise.all([
    supabase.from("businesses")
      .select("id, name, slug, business_type, status, is_featured, created_at")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("products")
      .select("id, name, slug, business_id, status, price, is_featured, created_at")
      .neq("status", "REMOVED")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(150)
  ]);

  if (businessError) throw new Error(`Unable to load marketplace businesses: ${businessError.message}`);
  if (productError) throw new Error(`Unable to load marketplace products: ${productError.message}`);

  const businessRows = businesses ?? [];
  const businessIds = [...new Set((products ?? []).map((row) => row.business_id as string))];
  const { data: productBusinesses, error: productBusinessError } = businessIds.length
    ? await supabase.from("businesses").select("id, name, status").in("id", businessIds)
    : { data: [], error: null };
  if (productBusinessError) throw new Error(`Unable to load product businesses: ${productBusinessError.message}`);
  const businessMap = new Map((productBusinesses ?? []).map((row) => [row.id as string, row]));

  return {
    businesses: businessRows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      business_type: row.business_type as string,
      status: row.status as string,
      is_featured: Boolean(row.is_featured),
      created_at: row.created_at as string
    })),
    products: (products ?? []).map((row) => {
      const business = businessMap.get(row.business_id as string);
      return {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        business_id: row.business_id as string,
        business_name: (business?.name as string) ?? "Unknown business",
        business_status: (business?.status as string) ?? "UNKNOWN",
        status: row.status as string,
        price: Number(row.price),
        is_featured: Boolean(row.is_featured),
        created_at: row.created_at as string
      };
    })
  };
}

export async function setFeaturedBusiness(adminId: string, businessId: string, featured: boolean) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_set_featured_business", {
    p_admin_id: adminId,
    p_business_id: businessId,
    p_featured: featured
  });
  if (error) {
    if (error.message.includes("BUSINESS_NOT_FOUND")) throw new Error("BUSINESS_NOT_FOUND");
    if (error.message.includes("BUSINESS_NOT_ACTIVE")) throw new Error("BUSINESS_NOT_ACTIVE");
    throw new Error(`Unable to update featured business: ${error.message}`);
  }
  return data;
}

export async function setFeaturedProduct(adminId: string, productId: string, featured: boolean) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_set_featured_product", {
    p_admin_id: adminId,
    p_product_id: productId,
    p_featured: featured
  });
  if (error) {
    if (error.message.includes("PRODUCT_NOT_FOUND")) throw new Error("PRODUCT_NOT_FOUND");
    if (error.message.includes("PRODUCT_NOT_PUBLIC")) throw new Error("PRODUCT_NOT_PUBLIC");
    throw new Error(`Unable to update featured product: ${error.message}`);
  }
  return data;
}
