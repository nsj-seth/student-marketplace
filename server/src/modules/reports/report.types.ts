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
  updated_at: string;
}
