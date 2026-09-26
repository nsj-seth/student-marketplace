import { createReportRecord, findAdminReport, listAdminReports, listOwnReports, resolveReportRecord, resolveReportTarget } from "./report.repository.js";
import type { ModerationAction, ReportReason, ReportStatus, ReportTargetType } from "./report.types.js";

export async function submitReport(userId: string, input: { targetType: ReportTargetType; targetId: string; reason: ReportReason; description: string }) {
  const target = await resolveReportTarget(input.targetType, input.targetId);
  if (!target) return null;
  if ((input.targetType === "USER" || input.targetType === "SELLER") && target.id === userId) {
    throw new Error("You cannot report your own account.");
  }
  return createReportRecord({ reporterId: userId, targetType: input.targetType, targetId: target.id, targetLabel: target.label, targetContext: target.context, reason: input.reason, description: input.description });
}

export const getOwnReports = listOwnReports;
export const getAdminReports = listAdminReports;
export const getAdminReport = findAdminReport;

export async function moderateReport(reportId: string, adminId: string, status: ReportStatus, action: ModerationAction, note: string) {
  if (status !== "ACTION_TAKEN" && action !== "NONE") throw new Error("A moderation action requires ACTION_TAKEN status.");
  if (status === "ACTION_TAKEN" && action === "NONE") throw new Error("Select a moderation action when marking action taken.");
  return resolveReportRecord(reportId, adminId, status, action, note);
}
