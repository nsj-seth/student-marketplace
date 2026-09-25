import { findPublicProductById, listPublicProducts } from "./public-product.repository.js";

export function getPublicProducts(filters: Parameters<typeof listPublicProducts>[0]) {
  return listPublicProducts(filters);
}

export function getPublicProduct(productId: string) {
  return findPublicProductById(productId);
}
