import { listPublicBusinesses } from "../businesses/public-business.repository.js";
import { listActiveCategories } from "../categories/category.repository.js";
import { listPublicProducts } from "../products/public-product.repository.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";

export async function getMarketplaceHome() {
  const [categories, businesses, products] = await Promise.all([
    listActiveCategories(),
    listPublicBusinesses({}),
    listPublicProducts({})
  ]);

  const supabase = getSupabaseAdminClient();
  const [featuredBusinessResult, featuredProductResult] = await Promise.all([
    supabase.from("businesses").select("id").eq("status", "ACTIVE").eq("is_featured", true),
    supabase.from("products").select("id").in("status", ["ACTIVE", "OUT_OF_STOCK"]).eq("is_featured", true)
  ]);

  if (featuredBusinessResult.error) {
    throw new Error(`Unable to load featured businesses: ${featuredBusinessResult.error.message}`);
  }
  if (featuredProductResult.error) {
    throw new Error(`Unable to load featured products: ${featuredProductResult.error.message}`);
  }

  const featuredBusinessIds = new Set((featuredBusinessResult.data ?? []).map((row) => row.id as string));
  const featuredProductIds = new Set((featuredProductResult.data ?? []).map((row) => row.id as string));

  return {
    categories: categories.slice(0, 12),
    featuredBusinesses: businesses.filter((business) => featuredBusinessIds.has(business.id)).slice(0, 6),
    featuredProducts: products.filter((product) => featuredProductIds.has(product.id)).slice(0, 8),
    newBusinesses: businesses.slice(0, 6),
    newProducts: products.slice(0, 8)
  };
}
