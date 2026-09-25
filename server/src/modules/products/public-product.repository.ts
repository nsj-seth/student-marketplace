import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { PublicProduct, PublicProductImage } from "./public-product.types.js";

const productFields = "id, business_id, category_id, name, slug, description, price, stock_quantity, status, created_at, updated_at";
const imageFields = "id, product_id, storage_path, alt_text, sort_order, is_primary";

function normalizeImage(row: Record<string, unknown>): PublicProductImage {
  return {
    id: row.id as string,
    storage_path: row.storage_path as string,
    alt_text: (row.alt_text as string | null) ?? null,
    sort_order: Number(row.sort_order),
    is_primary: Boolean(row.is_primary)
  };
}

async function attachPublicDetails(rows: Array<Record<string, unknown>>): Promise<PublicProduct[]> {
  if (!rows.length) return [];
  const supabase = getSupabaseAdminClient();
  const businessIds = [...new Set(rows.map((row) => row.business_id as string))];
  const categoryIds = [...new Set(rows.map((row) => row.category_id as string))];
  const productIds = rows.map((row) => row.id as string);

  const [businessResult, categoryResult, imageResult] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, business_type, availability_status, university_id, location_text, pickup_enabled, seller_delivery_enabled, logo_path, status")
      .in("id", businessIds)
      .eq("status", "ACTIVE"),
    supabase.from("categories").select("id, name, slug, is_active").in("id", categoryIds),
    supabase.from("product_images").select(imageFields).in("product_id", productIds).order("sort_order", { ascending: true }).order("created_at", { ascending: true })
  ]);

  if (businessResult.error) throw new Error(`Unable to load product businesses: ${businessResult.error.message}`);
  if (categoryResult.error) throw new Error(`Unable to load product categories: ${categoryResult.error.message}`);
  if (imageResult.error) throw new Error(`Unable to load product images: ${imageResult.error.message}`);

  const businessRows = (businessResult.data ?? []) as Array<Record<string, unknown>>;
  const universityIds = [...new Set(businessRows.map((row) => row.university_id).filter(Boolean))] as string[];
  let universityRows: Array<Record<string, unknown>> = [];
  if (universityIds.length) {
    const universityResult = await supabase.from("universities").select("id, name, short_name, slug").in("id", universityIds);
    if (universityResult.error) throw new Error(`Unable to load product universities: ${universityResult.error.message}`);
    universityRows = (universityResult.data ?? []) as Array<Record<string, unknown>>;
  }

  const universities = new Map(universityRows.map((row) => [row.id as string, row]));
  const businesses = new Map(businessRows.map((row) => [row.id as string, row]));
  const categories = new Map((categoryResult.data ?? []).map((row) => [row.id as string, row]));
  const imagesByProduct = new Map<string, PublicProductImage[]>();
  for (const row of imageResult.data ?? []) {
    const image = normalizeImage(row as Record<string, unknown>);
    const productId = (row as Record<string, unknown>).product_id as string;
    const list = imagesByProduct.get(productId) ?? [];
    list.push(image);
    imagesByProduct.set(productId, list);
  }

  const result: PublicProduct[] = [];
  for (const row of rows) {
    const businessRow = businesses.get(row.business_id as string);
    const categoryRow = categories.get(row.category_id as string) as { id: string; name: string; slug: string; is_active: boolean } | undefined;
    if (!businessRow || !categoryRow?.is_active) continue;

    const universityId = (businessRow.university_id as string | null) ?? null;
    const universityRow = universityId ? universities.get(universityId) : undefined;

    result.push({
      id: row.id as string,
      business_id: row.business_id as string,
      category_id: row.category_id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string,
      price: Number(row.price),
      stock_quantity: Number(row.stock_quantity),
      status: row.status as "ACTIVE" | "OUT_OF_STOCK",
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      category: { id: categoryRow.id, name: categoryRow.name, slug: categoryRow.slug },
      business: {
        id: businessRow.id as string,
        name: businessRow.name as string,
        slug: businessRow.slug as string,
        business_type: businessRow.business_type as "STUDENT_BUSINESS" | "OTHER_BUSINESS",
        availability_status: businessRow.availability_status as "OPEN" | "UNAVAILABLE",
        university_id: universityId,
        location_text: businessRow.location_text as string,
        pickup_enabled: Boolean(businessRow.pickup_enabled),
        seller_delivery_enabled: Boolean(businessRow.seller_delivery_enabled),
        logo_path: (businessRow.logo_path as string | null) ?? null,
        university: universityRow ? {
          id: universityRow.id as string,
          name: universityRow.name as string,
          short_name: (universityRow.short_name as string | null) ?? null,
          slug: universityRow.slug as string
        } : null
      },
      images: imagesByProduct.get(row.id as string) ?? []
    });
  }

  return result;
}

export async function listPublicProducts(filters: {
  search?: string;
  category?: string;
  business?: string;
  university?: string;
  businessType?: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
  availability?: "OPEN" | "UNAVAILABLE";
  stock?: "IN_STOCK" | "OUT_OF_STOCK";
}) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("products")
    .select(productFields)
    .in("status", ["ACTIVE", "OUT_OF_STOCK"])
    .order("created_at", { ascending: false });

  if (filters.search) {
    const safeSearch = filters.search.replace(/[%_,()]/g, " ").trim();
    if (safeSearch) query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.business) query = query.eq("business_id", filters.business);
  if (filters.stock === "IN_STOCK") query = query.eq("status", "ACTIVE").gt("stock_quantity", 0);
  if (filters.stock === "OUT_OF_STOCK") query = query.eq("status", "OUT_OF_STOCK");

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load public products: ${error.message}`);

  let products = await attachPublicDetails((data ?? []) as Array<Record<string, unknown>>);
  if (filters.university) products = products.filter((product) => product.business.university_id === filters.university);
  if (filters.businessType) products = products.filter((product) => product.business.business_type === filters.businessType);
  if (filters.availability) products = products.filter((product) => product.business.availability_status === filters.availability);
  return products;
}

export async function findPublicProductById(productId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(productFields)
    .eq("id", productId)
    .in("status", ["ACTIVE", "OUT_OF_STOCK"])
    .maybeSingle();

  if (error) throw new Error(`Unable to load public product: ${error.message}`);
  if (!data) return null;
  const [product] = await attachPublicDetails([data as Record<string, unknown>]);
  return product ?? null;
}
