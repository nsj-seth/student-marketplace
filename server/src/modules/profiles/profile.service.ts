import type { User } from "@supabase/supabase-js";
import { findRolesByUserId } from "../roles/role.repository.js";
import { findProfileById, updateProfileName } from "./profile.repository.js";

async function toProfileResponse(
  user: User,
  profile: Awaited<ReturnType<typeof findProfileById>>
) {
  const roles = await findRolesByUserId(user.id);

  return {
    id: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    fullName: profile.full_name,
    avatarPath: profile.avatar_path,
    roles,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at
  };
}

export async function getCurrentProfile(user: User) {
  const profile = await findProfileById(user.id);
  return toProfileResponse(user, profile);
}

export async function updateCurrentProfile(user: User, fullName: string) {
  const profile = await updateProfileName(user.id, fullName);
  return toProfileResponse(user, profile);
}
