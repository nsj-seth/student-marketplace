import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message ?? "API request failed");
  }

  return payload;
}
