import { findPublicProductById } from "../products/public-product.repository.js";
import {
  buildCartView,
  clearCartItems,
  deleteCartItem,
  findActiveCart,
  findCartItem,
  findCartItemByProduct,
  getOrCreateActiveCart,
  insertCartItem,
  setCartItemQuantity
} from "./cart.repository.js";

function cartError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

async function requireSellableProduct(productId: string) {
  const product = await findPublicProductById(productId);
  if (!product) throw cartError("PRODUCT_NOT_AVAILABLE", "Product not found or is no longer available.");
  if (product.status === "OUT_OF_STOCK" || product.stock_quantity <= 0) {
    throw cartError("INSUFFICIENT_STOCK", "This product is out of stock.");
  }
  if (product.business.availability_status !== "OPEN") {
    throw cartError("BUSINESS_UNAVAILABLE", "This business is currently unavailable.");
  }
  return product;
}

export async function getCart(userId: string) {
  return buildCartView(userId);
}

export async function addCartItem(userId: string, productId: string, quantity: number) {
  const product = await requireSellableProduct(productId);
  const cart = await getOrCreateActiveCart(userId);
  const existing = await findCartItemByProduct(cart.id, productId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (nextQuantity > product.stock_quantity) {
    throw cartError("INSUFFICIENT_STOCK", `Only ${product.stock_quantity} unit(s) are currently available.`);
  }
  if (nextQuantity > 99) throw cartError("INVALID_QUANTITY", "Cart quantity cannot exceed 99 units per product.");

  if (existing) await setCartItemQuantity(cart.id, existing.id, nextQuantity);
  else await insertCartItem(cart.id, productId, quantity);

  return buildCartView(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const cart = await findActiveCart(userId);
  if (!cart) throw cartError("CART_ITEM_NOT_FOUND", "Cart item not found.");
  const item = await findCartItem(cart.id, itemId);
  if (!item) throw cartError("CART_ITEM_NOT_FOUND", "Cart item not found.");

  const product = await requireSellableProduct(item.product_id);
  if (quantity > product.stock_quantity) {
    throw cartError("INSUFFICIENT_STOCK", `Only ${product.stock_quantity} unit(s) are currently available.`);
  }

  await setCartItemQuantity(cart.id, item.id, quantity);
  return buildCartView(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await findActiveCart(userId);
  if (!cart) return buildCartView(userId);
  const item = await findCartItem(cart.id, itemId);
  if (!item) throw cartError("CART_ITEM_NOT_FOUND", "Cart item not found.");
  await deleteCartItem(cart.id, itemId);
  return buildCartView(userId);
}

export async function clearCart(userId: string) {
  const cart = await findActiveCart(userId);
  if (cart) await clearCartItems(cart.id);
  return buildCartView(userId);
}
