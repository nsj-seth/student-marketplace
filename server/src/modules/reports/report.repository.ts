import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { ModerationAction, ReportRecord, ReportStatus, ReportTargetType } from "./report.types.js";

const fields = "id, reporter_id, target_type, target_id, target_label, target_context, reason, description, status, admin_action, admin_note, reviewed_by, reviewed_at, created_at, updated_at";

export async function resolveReportTarget(targetType: ReportTargetType, suppliedId: string) {
  const supabase = getSupabaseAdminClient();
  if (targetType === "PRODUCT") {
    const { data, error } = await supabase.from("products").select("id, name, status").eq("id", suppliedId).neq("status", "REMOVED").maybeSingle();
    if (error) throw new Error(`Unable to validate product report target: ${error.message}`);
    return data ? { id: data.id as string, label: data.name as string, context: {} } : null;
  }
  if (targetType === "BUSINESS") {
    const { data, error } = await supabase.from("businesses").select("id, name").eq("id", suppliedId).maybeSingle();
    if (error) throw new Error(`Unable to validate business report target: ${error.message}`);
    return data ? { id: data.id as string, label: data.name as string, context: {} } : null;
  }
  if (targetType === "SELLER") {
    // For public reporting, suppliedId is a business id; the private owner id is resolved server-side.
    const { data, error } = await supabase.from("businesses").select("id, name, owner_id").eq("id", suppliedId).maybeSingle();
    if (error) throw new Error(`Unable to validate seller report target: ${error.message}`);
    return data ? { id: data.owner_id as string, label: `${data.name as string} seller`, context: { businessId: data.id } } : null;
  }
  const { data, error } = await supabase.from("profiles").select("id, full_name").eq("id", suppliedId).maybeSingle();
  if (error) throw new Error(`Unable to validate user report target: ${error.message}`);
  return data ? { id: data.id as string, label: (data.full_name as string) || "Marketplace user", context: {} } : null;
}

export async function createReportRecord(input: {
  reporterId: string; targetType: ReportTargetType; targetId: string; targetLabel: string; targetContext: Record<string, unknown>; reason: string; description: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    target_label: input.targetLabel,
    target_context: input.targetContext,
    reason: input.reason,
    description: input.description || null
  }).select(fields).single();
  if (error) throw new Error(`Unable to submit report: ${error.message}`);
  return data as ReportRecord;
}

export async function listOwnReports(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("reports").select(fields).eq("reporter_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load reports: ${error.message}`);
  return (data ?? []) as ReportRecord[];
}

export async function listAdminReports(status?: ReportStatus, targetType?: ReportTargetType) {
  const supabase = getSupabaseAdminClient();
  let query = supabase.from("reports").select(fields).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (targetType) query = query.eq("target_type", targetType);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load moderation reports: ${error.message}`);
  return (data ?? []) as ReportRecord[];
}

export async function findAdminReport(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("reports").select(fields).eq("id", id).maybeSingle();
  if (error) throw new Error(`Unable to load report: ${error.message}`);
  return (data as ReportRecord | null) ?? null;
}

export async function resolveReportRecord(reportId: string, adminId: string, status: ReportStatus, action: ModerationAction, note: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("resolve_moderation_report", {
    p_report_id: reportId,
    p_admin_id: adminId,
    p_status: status,
    p_action: action,
    p_note: note || null
  });
  if (error) throw new Error(`Unable to resolve report: ${error.message}`);
  return findAdminReport(reportId);
}
