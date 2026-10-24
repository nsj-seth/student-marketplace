import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
}

export class ApiError extends Error {
  code?: string;
  status: number;
  requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const responseRequestId = response.headers.get("x-request-id") ?? undefined;
  const contentType = response.headers.get("content-type") ?? "";

  let payload: ApiResponse<T>;
  if (contentType.includes("application/json")) {
    payload = (await response.json()) as ApiResponse<T>;
  } else {
    payload = { success: false, message: response.ok ? "Unexpected API response." : "API request failed." };
  }

  if (!response.ok) {
    throw new ApiError(
      payload.message ?? "API request failed",
      response.status,
      payload.code,
      payload.requestId ?? responseRequestId
    );
  }

  return payload;
}
