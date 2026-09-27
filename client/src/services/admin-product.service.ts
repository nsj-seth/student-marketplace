import { apiRequest } from "./api";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "HIDDEN" | "REMOVED";

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

export interface AdminProductListData {
  items: AdminProductRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getAdminProducts(filters: { search?: string; status?: ProductStatus; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return apiRequest<AdminProductListData>(`/admin/products${query ? `?${query}` : ""}`);
}

export function setAdminProductStatus(id: string, action: "HIDE" | "RESTORE", reason = "") {
  return apiRequest<{ id: string; action: string }>(`/admin/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason })
  });
}
