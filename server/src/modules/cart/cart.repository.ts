import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { listPublicProductsByIds } from "../products/public-product.repository.js";
import type { CartBusinessGroup, CartItemView, CartView } from "./cart.types.js";

interface CartRow {
  id: string;
  user_id: string;
  status: "ACTIVE";
  created_at: string;
  updated_at: string;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export async function findActiveCart(userId: string): Promise<CartRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .select("id, user_id, status, created_at, updated_at")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw new Error(`Unable to load cart: ${error.message}`);
  return data as CartRow | null;
}

export async function getOrCreateActiveCart(userId: string): Promise<CartRow> {
  const existing = await findActiveCart(userId);
  if (existing) return existing;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId, status: "ACTIVE" })
    .select("id, user_id, status, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const raced = await findActiveCart(userId);
      if (raced) return raced;
    }
    throw new Error(`Unable to create cart: ${error.message}`);
  }

  return data as CartRow;
}

export async function findCartItem(cartId: string, itemId: string): Promise<CartItemRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, created_at, updated_at")
    .eq("cart_id", cartId)
    .eq("id", itemId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load cart item: ${error.message}`);
  return data as CartItemRow | null;
}

export async function findCartItemByProduct(cartId: string, productId: string): Promise<CartItemRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, created_at, updated_at")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load cart item: ${error.message}`);
  return data as CartItemRow | null;
}

export async function insertCartItem(cartId: string, productId: string, quantity: number): Promise<CartItemRow> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .insert({ cart_id: cartId, product_id: productId, quantity })
    .select("id, cart_id, product_id, quantity, created_at, updated_at")
    .single();
  if (error) throw new Error(`Unable to add cart item: ${error.message}`);
  return data as CartItemRow;
}

export async function setCartItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartItemRow> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("cart_id", cartId)
    .eq("id", itemId)
    .select("id, cart_id, product_id, quantity, created_at, updated_at")
    .single();
  if (error) throw new Error(`Unable to update cart item: ${error.message}`);
  return data as CartItemRow;
}

export async function deleteCartItem(cartId: string, itemId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("id", itemId);
  if (error) throw new Error(`Unable to remove cart item: ${error.message}`);
}

export async function clearCartItems(cartId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw new Error(`Unable to clear cart: ${error.message}`);
}

export async function buildCartView(userId: string): Promise<CartView> {
  const cart = await findActiveCart(userId);
  if (!cart) {
    return { id: null, status: "ACTIVE", items: [], groups: [], item_count: 0, total_quantity: 0, total: 0 };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, created_at, updated_at")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Unable to load cart items: ${error.message}`);

  const rows = (data ?? []) as CartItemRow[];
  const products = await listPublicProductsByIds(rows.map((row) => row.product_id));
  const productsById = new Map(products.map((product) => [product.id, product]));

  const items: CartItemView[] = rows.flatMap((row) => {
    const product = productsById.get(row.product_id);
    if (!product) return [];
    return [{
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product,
      subtotal: Number((product.price * row.quantity).toFixed(2))
    }];
  });

  const grouped = new Map<string, CartBusinessGroup>();
  for (const item of items) {
    const key = item.product.business.id;
    const current = grouped.get(key) ?? { business: item.product.business, items: [], subtotal: 0 };
    current.items.push(item);
    current.subtotal = Number((current.subtotal + item.subtotal).toFixed(2));
    grouped.set(key, current);
  }

  return {
    id: cart.id,
    status: "ACTIVE",
    items,
    groups: [...grouped.values()],
    item_count: items.length,
    total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    total: Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2))
  };
}
