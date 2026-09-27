import type { ProductStatus } from "../products/product.types.js";
export interface AdminProductRecord {
  id: string;
  business_id: string;
  business_name: string;
  owner_name: string;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  status: ProductStatus;
  category_name: string | null;
  created_at: string;
  updated_at: string;
  admin_status_reason: string | null;
  admin_status_changed_at: string | null;
}
