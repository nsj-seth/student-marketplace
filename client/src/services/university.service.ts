import { apiRequest } from "./api";

export interface University {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function getUniversities() {
  return apiRequest<University[]>("/universities");
}

export function getAdminUniversities() {
  return apiRequest<University[]>("/admin/universities");
}

export function createUniversity(input: {
  name: string;
  shortName?: string;
  country: string;
}) {
  return apiRequest<University>("/admin/universities", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateUniversity(
  id: string,
  input: { name?: string; shortName?: string | null; country?: string; isActive?: boolean }
) {
  return apiRequest<University>(`/admin/universities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function disableUniversity(id: string) {
  return apiRequest<University>(`/admin/universities/${id}`, { method: "DELETE" });
}
