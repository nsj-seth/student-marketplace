import { apiRequest } from "./api";

export type AppRole = "CUSTOMER" | "SELLER" | "ADMIN";

export async function getMyRoles(signal?: AbortSignal) {
  return apiRequest<{ roles: AppRole[] }>("/me/roles", { signal });
}

export async function checkRoleAccess(role: AppRole) {
  return apiRequest<{ message: string }>(`/access/${role.toLowerCase()}`);
}
