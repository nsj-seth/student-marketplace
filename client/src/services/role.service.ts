import { apiRequest } from "./api";

export type AppRole = "CUSTOMER" | "SELLER" | "ADMIN";

export async function getMyRoles() {
  return apiRequest<{ roles: AppRole[] }>("/me/roles");
}

export async function checkRoleAccess(role: AppRole) {
  return apiRequest<{ message: string }>(`/access/${role.toLowerCase()}`);
}
