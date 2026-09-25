export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "HIDDEN" | "REMOVED";

export interface ProductImageRecord {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductRecord {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ManagedProduct extends ProductRecord {
  category: { id: string; name: string; slug: string; is_active: boolean } | null;
  images: ProductImageRecord[];
}
