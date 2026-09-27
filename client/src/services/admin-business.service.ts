import { apiRequest } from "./api";

export type BusinessStatus = "ACTIVE" | "DISABLED" | "SUSPENDED";
export type BusinessType = "STUDENT_BUSINESS" | "OTHER_BUSINESS";

export interface AdminBusinessRecord {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string | null;
  business_type: BusinessType;
  name: string;
  slug: string;
  description: string;
  university_id: string | null;
  university_name: string | null;
  location_text: string;
  contact_phone: string;
  status: BusinessStatus;
  availability_status: "OPEN" | "UNAVAILABLE";
  product_count: number;
  created_at: string;
  updated_at: string;
  admin_status_reason: string | null;
  admin_status_changed_at: string | null;
}

export interface AdminBusinessListData {
  items: AdminBusinessRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getAdminBusinesses(filters: { search?: string; status?: BusinessStatus; businessType?: BusinessType; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.businessType) params.set("businessType", filters.businessType);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return apiRequest<AdminBusinessListData>(`/admin/businesses${query ? `?${query}` : ""}`);
}

export function setAdminBusinessStatus(id: string, action: "DISABLE" | "REACTIVATE", reason = "") {
  return apiRequest<{ id: string; action: string }>(`/admin/businesses/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason })
  });
}
