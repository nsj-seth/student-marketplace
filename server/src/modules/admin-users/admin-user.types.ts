import type { AppRole } from "../roles/role.types.js";

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
