import { apiRequest } from "./api";
import type { PublicProduct } from "./product.service";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: PublicProduct;
}

export function getWishlist() {
  return apiRequest<WishlistItem[]>("/wishlist");
}

export function getWishlistStatus(productId: string) {
  return apiRequest<{ wishlisted: boolean }>(`/wishlist/${productId}/status`);
}

export function addToWishlist(productId: string) {
  return apiRequest<{ item: { id: string; product_id: string; created_at: string }; product: PublicProduct }>("/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId })
  });
}

export function removeFromWishlist(productId: string) {
  return apiRequest<{ removed: boolean }>(`/wishlist/${productId}`, {
    method: "DELETE"
  });
}
