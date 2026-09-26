import { apiRequest } from "./api";

export type ReportTargetType = "PRODUCT" | "BUSINESS" | "SELLER" | "USER";
export type ReportReason = "SPAM" | "FRAUD" | "INAPPROPRIATE" | "MISLEADING" | "HARASSMENT" | "OTHER";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";
export type ModerationAction = "NONE" | "HIDE_PRODUCT" | "DISABLE_BUSINESS" | "SUSPEND_USER";

export interface ReportRecord {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  target_label: string | null;
  target_context: Record<string, unknown>;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_action: ModerationAction | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function createReport(input: { targetType: ReportTargetType; targetId: string; reason: ReportReason; description?: string }) {
  return apiRequest<ReportRecord>("/reports", { method: "POST", body: JSON.stringify(input) });
}

export function getMyReports() {
  return apiRequest<ReportRecord[]>("/reports/mine");
}

export function getAdminReports(filters: { status?: ReportStatus; targetType?: ReportTargetType } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.targetType) params.set("targetType", filters.targetType);
  return apiRequest<ReportRecord[]>(`/admin/reports${params.size ? `?${params}` : ""}`);
}

export function resolveAdminReport(id: string, input: { status: Exclude<ReportStatus, "PENDING">; action: ModerationAction; note?: string }) {
  return apiRequest<ReportRecord>(`/admin/reports/${id}/resolve`, { method: "PATCH", body: JSON.stringify(input) });
}
