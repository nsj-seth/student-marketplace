import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { listPublicProductsByIds } from "../products/public-product.repository.js";
import type { WishlistItem } from "./wishlist.types.js";

interface WishlistRow {
  id: string;
  product_id: string;
  created_at: string;
}

export async function listWishlistItems(userId: string): Promise<WishlistItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id, product_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load wishlist: ${error.message}`);

  const rows = (data ?? []) as WishlistRow[];
  const products = await listPublicProductsByIds(rows.map((row) => row.product_id));
  const productsById = new Map(products.map((product) => [product.id, product]));

  return rows.flatMap((row) => {
    const product = productsById.get(row.product_id);
    return product ? [{ ...row, product }] : [];
  });
}

export async function findWishlistItem(userId: string, productId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id, product_id, created_at")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw new Error(`Unable to check wishlist: ${error.message}`);
  return data as WishlistRow | null;
}

export async function createWishlistItem(userId: string, productId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({ user_id: userId, product_id: productId })
    .select("id, product_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") return findWishlistItem(userId, productId);
    throw new Error(`Unable to add wishlist item: ${error.message}`);
  }

  return data as WishlistRow;
}

export async function deleteWishlistItem(userId: string, productId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw new Error(`Unable to remove wishlist item: ${error.message}`);
}
