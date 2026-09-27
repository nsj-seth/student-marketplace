import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { AppRole } from "../roles/role.types.js";
import type { AccountStatus, AdminUserRecord } from "./admin-user.types.js";

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_path: string | null;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

interface RoleRow { user_id: string; role: AppRole; }

async function loadAllAdminUsers(): Promise<AdminUserRecord[]> {
  const supabase = getSupabaseAdminClient();

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, authResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_path, account_status, created_at, updated_at, suspension_reason, suspended_at, suspended_by"),
    supabase.from("user_roles").select("user_id, role"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  ]);

  if (profilesError) throw new Error(`Unable to load users: ${profilesError.message}`);
  if (rolesError) throw new Error(`Unable to load user roles: ${rolesError.message}`);
  if (authResult.error) throw new Error(`Unable to load authentication users: ${authResult.error.message}`);

  const roleMap = new Map<string, AppRole[]>();
  for (const entry of (roles ?? []) as RoleRow[]) {
    const current = roleMap.get(entry.user_id) ?? [];
    current.push(entry.role);
    roleMap.set(entry.user_id, current);
  }

  const authMap = new Map(authResult.data.users.map((user) => [user.id, user]));

  return ((profiles ?? []) as ProfileRow[]).map((profile) => {
    const authUser = authMap.get(profile.id);
    return {
      ...profile,
      email: authUser?.email ?? null,
      roles: (roleMap.get(profile.id) ?? []).sort(),
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null
    };
  });
}

export async function listAdminUsers(input: {
  search?: string;
  status?: AccountStatus;
  role?: AppRole;
  page: number;
  limit: number;
}) {
  const all = await loadAllAdminUsers();
  const term = input.search?.toLowerCase();

  const filtered = all.filter((user) => {
    if (input.status && user.account_status !== input.status) return false;
    if (input.role && !user.roles.includes(input.role)) return false;
    if (term) {
      const haystack = `${user.full_name} ${user.email ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));

  const start = (input.page - 1) * input.limit;
  return {
    items: filtered.slice(start, start + input.limit),
    page: input.page,
    limit: input.limit,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / input.limit))
  };
}

export async function findAdminUserById(userId: string) {
  const users = await loadAllAdminUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function setAdminUserAccountStatus(
  adminId: string,
  userId: string,
  status: AccountStatus,
  reason: string
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("admin_set_user_account_status", {
    p_admin_id: adminId,
    p_user_id: userId,
    p_status: status,
    p_reason: reason || null
  });

  if (error) {
    const message = error.message || "";
    if (message.includes("CANNOT_SUSPEND_SELF")) throw new Error("CANNOT_SUSPEND_SELF");
    if (message.includes("CANNOT_SUSPEND_ADMIN")) throw new Error("CANNOT_SUSPEND_ADMIN");
    if (message.includes("USER_NOT_FOUND")) throw new Error("USER_NOT_FOUND");
    throw new Error(`Unable to update user account: ${message}`);
  }

  return findAdminUserById(userId);
}
