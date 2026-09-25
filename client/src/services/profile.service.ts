import { apiRequest } from "./api";

export interface CurrentProfile {
  id: string;
  email: string | null;
  emailVerified: boolean;
  fullName: string;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCurrentProfile() {
  return apiRequest<CurrentProfile>("/me");
}

export async function updateCurrentProfile(fullName: string) {
  return apiRequest<CurrentProfile>("/me", {
    method: "PATCH",
    body: JSON.stringify({ fullName })
  });
}
