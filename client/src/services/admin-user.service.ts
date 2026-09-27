import { apiRequest } from "./api";

export type AppRole = "CUSTOMER" | "SELLER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "SUSPENDED";

export interface AdminUserRecord {
  id: string;
  email: string | null;
  full_name: string;
  avatar_path: string | null;
  account_status: AccountStatus;
  roles: AppRole[];
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

export interface AdminUserListData {
  items: AdminUserRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getAdminUsers(filters: {
  search?: string;
  status?: AccountStatus;
  role?: AppRole;
  page?: number;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.role) params.set("role", filters.role);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return apiRequest<AdminUserListData>(`/admin/users${query ? `?${query}` : ""}`);
}

export function getAdminUser(id: string) {
  return apiRequest<AdminUserRecord>(`/admin/users/${id}`);
}

export function setAdminUserStatus(id: string, status: AccountStatus, reason = "") {
  return apiRequest<AdminUserRecord>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason })
  });
}
