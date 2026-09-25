import { apiRequest } from "./api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function getCategories() {
  return apiRequest<Category[]>("/categories");
}

export function getAdminCategories() {
  return apiRequest<Category[]>("/admin/categories");
}

export function createCategory(input: { name: string; description?: string }) {
  return apiRequest<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateCategory(
  id: string,
  input: { name?: string; description?: string | null; isActive?: boolean }
) {
  return apiRequest<Category>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function disableCategory(id: string) {
  return apiRequest<Category>(`/admin/categories/${id}`, { method: "DELETE" });
}
