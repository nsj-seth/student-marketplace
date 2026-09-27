import type { AppRole } from "../roles/role.types.js";
import { findAdminUserById, listAdminUsers, setAdminUserAccountStatus } from "./admin-user.repository.js";
import type { AccountStatus } from "./admin-user.types.js";

export async function getAdminUsers(input: {
  search?: string; status?: AccountStatus; role?: AppRole; page: number; limit: number;
}) {
  return listAdminUsers(input);
}

export async function getAdminUser(userId: string) {
  return findAdminUserById(userId);
}

export async function updateAdminUserStatus(adminId: string, userId: string, status: AccountStatus, reason: string) {
  return setAdminUserAccountStatus(adminId, userId, status, reason);
}
