import type { PublicProduct } from "../products/public-product.types.js";

export interface CartItemView {
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
  items: CartItemView[];
  subtotal: number;
}

export interface CartView {
  id: string | null;
  status: "ACTIVE";
  items: CartItemView[];
  groups: CartBusinessGroup[];
  item_count: number;
  total_quantity: number;
  total: number;
}
