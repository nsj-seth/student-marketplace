import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { toSlug } from "../../utils/slug.js";
import type { ManagedProduct, ProductImageRecord, ProductRecord, ProductStatus } from "./product.types.js";

const fields = "id, business_id, category_id, name, slug, description, price, stock_quantity, status, created_at, updated_at";
const imageFields = "id, product_id, storage_path, alt_text, sort_order, is_primary, created_at";

function normalizeProduct(row: Record<string, unknown>): ProductRecord {
  return {
    ...(row as unknown as ProductRecord),
    price: Number(row.price),
    stock_quantity: Number(row.stock_quantity)
  };
}

function normalizeImage(row: Record<string, unknown>): ProductImageRecord {
  return {
    ...(row as unknown as ProductImageRecord),
    sort_order: Number(row.sort_order),
    is_primary: Boolean(row.is_primary)
  };
}

async function attachDetails(rows: ProductRecord[]): Promise<ManagedProduct[]> {
  if (!rows.length) return [];
  const supabase = getSupabaseAdminClient();
  const categoryIds = [...new Set(rows.map((row) => row.category_id))];
  const productIds = rows.map((row) => row.id);
  const [categoryResult, imageResult] = await Promise.all([
    supabase.from("categories").select("id, name, slug, is_active").in("id", categoryIds),
    supabase.from("product_images").select(imageFields).in("product_id", productIds).order("sort_order", { ascending: true }).order("created_at", { ascending: true })
  ]);
  if (categoryResult.error) throw new Error(`Unable to load product categories: ${categoryResult.error.message}`);
  if (imageResult.error) throw new Error(`Unable to load product images: ${imageResult.error.message}`);

  const categories = new Map((categoryResult.data ?? []).map((row) => [row.id as string, row]));
  const imagesByProduct = new Map<string, ProductImageRecord[]>();
  for (const row of imageResult.data ?? []) {
    const image = normalizeImage(row as Record<string, unknown>);
    const list = imagesByProduct.get(image.product_id) ?? [];
    list.push(image);
    imagesByProduct.set(image.product_id, list);
  }

  return rows.map((row) => ({
    ...row,
    category: (categories.get(row.category_id) as ManagedProduct["category"] | undefined) ?? null,
    images: imagesByProduct.get(row.id) ?? []
  }));
}

export async function businessBelongsToOwner(businessId: string, ownerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new Error(`Unable to verify business ownership: ${error.message}`);
  return Boolean(data);
}

export async function categoryIsAllowedForBusiness(businessId: string, categoryId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("business_categories")
    .select("category_id, categories!inner(id, is_active)")
    .eq("business_id", businessId)
    .eq("category_id", categoryId)
    .eq("categories.is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Unable to validate product category: ${error.message}`);
  return Boolean(data);
}

export async function listProductsForOwnedBusiness(businessId: string, ownerId: string) {
  if (!(await businessBelongsToOwner(businessId, ownerId))) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(fields)
    .eq("business_id", businessId)
    .neq("status", "REMOVED")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load products: ${error.message}`);
  return attachDetails((data ?? []).map((row) => normalizeProduct(row as Record<string, unknown>)));
}

export async function findProductForOwnedBusiness(productId: string, businessId: string, ownerId: string) {
  if (!(await businessBelongsToOwner(businessId, ownerId))) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(fields)
    .eq("id", productId)
    .eq("business_id", businessId)
    .neq("status", "REMOVED")
    .maybeSingle();
  if (error) throw new Error(`Unable to load product: ${error.message}`);
  if (!data) return null;
  const [product] = await attachDetails([normalizeProduct(data as Record<string, unknown>)]);
  return product ?? null;
}

export async function createProductRecord(input: {
  businessId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const base = toSlug(input.name) || "product";
  const slug = `${base}-${randomUUID().slice(0, 8)}`;
  const status: ProductStatus = input.quantity === 0 ? "OUT_OF_STOCK" : "ACTIVE";
  const { data, error } = await supabase
    .from("products")
    .insert({
      business_id: input.businessId,
      category_id: input.categoryId,
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      price: input.price,
      stock_quantity: input.quantity,
      status
    })
    .select(fields)
    .single();
  if (error) throw new Error(`Unable to create product: ${error.message}`);
  const [product] = await attachDetails([normalizeProduct(data as Record<string, unknown>)]);
  return product!;
}

export async function updateProductRecord(product: ManagedProduct, input: {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}) {
  const supabase = getSupabaseAdminClient();
  let status = product.status;
  if (status !== "HIDDEN") {
    if (input.quantity === 0) status = "OUT_OF_STOCK";
    else if (status === "OUT_OF_STOCK") status = "ACTIVE";
  }
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      stock_quantity: input.quantity,
      category_id: input.categoryId,
      status
    })
    .eq("id", product.id)
    .select(fields)
    .single();
  if (error) throw new Error(`Unable to update product: ${error.message}`);
  const [updated] = await attachDetails([normalizeProduct(data as Record<string, unknown>)]);
  return updated!;
}

export async function updateInventoryRecord(product: ManagedProduct, quantity: number) {
  const supabase = getSupabaseAdminClient();
  let status = product.status;
  if (status !== "HIDDEN" && status !== "INACTIVE") {
    status = quantity === 0 ? "OUT_OF_STOCK" : "ACTIVE";
  }
  const { data, error } = await supabase
    .from("products")
    .update({ stock_quantity: quantity, status })
    .eq("id", product.id)
    .select(fields)
    .single();
  if (error) throw new Error(`Unable to update inventory: ${error.message}`);
  const [updated] = await attachDetails([normalizeProduct(data as Record<string, unknown>)]);
  return updated!;
}

export async function updateStatusRecord(product: ManagedProduct, requested: "ACTIVE" | "INACTIVE") {
  const supabase = getSupabaseAdminClient();
  const status: ProductStatus = requested === "ACTIVE" && product.stock_quantity === 0
    ? "OUT_OF_STOCK"
    : requested;
  const { data, error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", product.id)
    .select(fields)
    .single();
  if (error) throw new Error(`Unable to update product status: ${error.message}`);
  const [updated] = await attachDetails([normalizeProduct(data as Record<string, unknown>)]);
  return updated!;
}

export async function softRemoveProductRecord(productId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status: "REMOVED" })
    .eq("id", productId);
  if (error) throw new Error(`Unable to remove product: ${error.message}`);
}

export async function createProductImageRecord(productId: string, storagePath: string, altText: string | null) {
  const supabase = getSupabaseAdminClient();
  const { count, error: countError } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (countError) throw new Error(`Unable to count product images: ${countError.message}`);
  if ((count ?? 0) >= 8) return { kind: "LIMIT_REACHED" as const };

  const { data: lastRows, error: orderError } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (orderError) throw new Error(`Unable to determine image order: ${orderError.message}`);
  const sortOrder = lastRows?.[0] ? Number(lastRows[0].sort_order) + 1 : 0;
  const isPrimary = (count ?? 0) === 0;

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: storagePath, alt_text: altText, sort_order: sortOrder, is_primary: isPrimary })
    .select(imageFields)
    .single();
  if (error) throw new Error(`Unable to attach product image: ${error.message}`);
  return { kind: "OK" as const, image: normalizeImage(data as Record<string, unknown>) };
}

export async function findProductImage(productId: string, imageId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_images")
    .select(imageFields)
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load product image: ${error.message}`);
  return data ? normalizeImage(data as Record<string, unknown>) : null;
}

export async function setPrimaryImageRecord(productId: string, imageId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("set_product_primary_image", { p_product_id: productId, p_image_id: imageId });
  if (error) throw new Error(`Unable to set primary image: ${error.message}`);
}

export async function reorderImagesRecord(productId: string, imageIds: string[]) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("reorder_product_images", { p_product_id: productId, p_image_ids: imageIds });
  if (error) throw new Error(`Unable to reorder product images: ${error.message}`);
}

export async function deleteProductImageRecord(image: ProductImageRecord) {
  const supabase = getSupabaseAdminClient();
  const { error: storageError } = await supabase.storage.from("product-images").remove([image.storage_path]);
  if (storageError) throw new Error(`Unable to remove product image file: ${storageError.message}`);

  const { error } = await supabase.from("product_images").delete().eq("id", image.id);
  if (error) throw new Error(`Unable to remove product image metadata: ${error.message}`);

  if (image.is_primary) {
    const { data: next, error: nextError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", image.product_id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (nextError) throw new Error(`Unable to choose replacement primary image: ${nextError.message}`);
    if (next) await setPrimaryImageRecord(image.product_id, next.id as string);
  }
}
