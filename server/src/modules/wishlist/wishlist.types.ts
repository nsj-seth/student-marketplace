import type { PublicProduct } from "../products/public-product.types.js";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: PublicProduct;
}
