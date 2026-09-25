import { apiRequest } from "./api";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "HIDDEN" | "REMOVED";

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ManagedProduct {
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
  category: { id: string; name: string; slug: string; is_active: boolean } | null;
  images: ProductImage[];
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}

const base = (businessId: string) => `/seller/businesses/${businessId}/products`;

export function getSellerProducts(businessId: string) {
  return apiRequest<ManagedProduct[]>(base(businessId));
}

export function getSellerProduct(businessId: string, productId: string) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}`);
}

export function createSellerProduct(businessId: string, input: ProductInput) {
  return apiRequest<ManagedProduct>(base(businessId), { method: "POST", body: JSON.stringify(input) });
}

export function updateSellerProduct(businessId: string, productId: string, input: ProductInput) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function updateSellerProductInventory(businessId: string, productId: string, quantity: number) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}/inventory`, { method: "PATCH", body: JSON.stringify({ quantity }) });
}

export function updateSellerProductStatus(businessId: string, productId: string, status: "ACTIVE" | "INACTIVE") {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function removeSellerProduct(businessId: string, productId: string) {
  return apiRequest<{ removed: boolean }>(`${base(businessId)}/${productId}`, { method: "DELETE" });
}

export function attachSellerProductImage(businessId: string, productId: string, storagePath: string, altText?: string | null) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}/images`, {
    method: "POST",
    body: JSON.stringify({ storagePath, altText: altText ?? null })
  });
}

export function reorderSellerProductImages(businessId: string, productId: string, imageIds: string[]) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}/images/order`, {
    method: "PATCH",
    body: JSON.stringify({ imageIds })
  });
}

export function setSellerProductPrimaryImage(businessId: string, productId: string, imageId: string) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}/images/${imageId}/primary`, { method: "PATCH" });
}

export function removeSellerProductImage(businessId: string, productId: string, imageId: string) {
  return apiRequest<ManagedProduct>(`${base(businessId)}/${productId}/images/${imageId}`, { method: "DELETE" });
}

export interface PublicProduct {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  status: "ACTIVE" | "OUT_OF_STOCK";
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; slug: string } | null;
  business: {
    id: string;
    name: string;
    slug: string;
    business_type: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
    availability_status: "OPEN" | "UNAVAILABLE";
    university_id: string | null;
    location_text: string;
    pickup_enabled: boolean;
    seller_delivery_enabled: boolean;
    logo_path: string | null;
    university: null | { id: string; name: string; short_name: string | null; slug: string };
  };
  images: ProductImage[];
}

export interface PublicProductFilters {
  search?: string;
  category?: string;
  business?: string;
  university?: string;
  businessType?: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
  availability?: "OPEN" | "UNAVAILABLE";
  stock?: "IN_STOCK" | "OUT_OF_STOCK";
  fulfilment?: "PICKUP" | "SELLER_DELIVERY";
  minPrice?: number;
  maxPrice?: number;
  sort?: "NEWEST" | "PRICE_LOW_TO_HIGH" | "PRICE_HIGH_TO_LOW" | "NAME_A_TO_Z";
}

export function getPublicProducts(filters: PublicProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.business) params.set("business", filters.business);
  if (filters.university) params.set("university", filters.university);
  if (filters.businessType) params.set("businessType", filters.businessType);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.stock) params.set("stock", filters.stock);
  if (filters.fulfilment) params.set("fulfilment", filters.fulfilment);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<PublicProduct[]>(`/products${suffix}`);
}

export function getPublicProduct(productId: string) {
  return apiRequest<PublicProduct>(`/products/${encodeURIComponent(productId)}`);
}
