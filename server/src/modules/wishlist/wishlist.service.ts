import { findPublicProductById } from "../products/public-product.repository.js";
import {
  createWishlistItem,
  deleteWishlistItem,
  findWishlistItem,
  listWishlistItems
} from "./wishlist.repository.js";

export async function getWishlist(userId: string) {
  return listWishlistItems(userId);
}

export async function getWishlistStatus(userId: string, productId: string) {
  const item = await findWishlistItem(userId, productId);
  return { wishlisted: Boolean(item) };
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await findPublicProductById(productId);
  if (!product) {
    const error = new Error("Product not found or is not currently available in the marketplace.");
    error.name = "PRODUCT_NOT_AVAILABLE";
    throw error;
  }

  const item = await createWishlistItem(userId, productId);
  return { item, product };
}

export async function removeFromWishlist(userId: string, productId: string) {
  await deleteWishlistItem(userId, productId);
}
