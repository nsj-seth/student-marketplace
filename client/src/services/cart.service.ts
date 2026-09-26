import { apiRequest } from "./api";
import type { PublicProduct } from "./product.service";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: PublicProduct;
  subtotal: number;
}

export interface CartBusinessGroup {
  business: PublicProduct["business"];
  items: CartItem[];
  subtotal: number;
}

export interface Cart {
  id: string | null;
  status: "ACTIVE";
  items: CartItem[];
  groups: CartBusinessGroup[];
  item_count: number;
  total_quantity: number;
  total: number;
}

export function getCart() {
  return apiRequest<Cart>("/cart");
}

export function addToCart(productId: string, quantity = 1) {
  return apiRequest<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity })
  });
}

export function updateCartQuantity(itemId: string, quantity: number) {
  return apiRequest<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity })
  });
}

export function removeCartItem(itemId: string) {
  return apiRequest<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
}

export function clearCart() {
  return apiRequest<Cart>("/cart", { method: "DELETE" });
}
