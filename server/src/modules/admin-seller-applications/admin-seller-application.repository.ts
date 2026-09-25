import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { AdminSellerApplication, ReviewSellerApplicationResult } from "./admin-seller-application.types.js";
import type { SellerApplicationStatus } from "../seller-applications/seller-application.types.js";

const applicationFields =
  "id, applicant_id, business_type, status, business_name, description, location_text, contact_phone, social_links, pickup_enabled, seller_delivery_enabled, logo_path, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at";

async function hydrateApplication(application: any): Promise<AdminSellerApplication> {
  const supabase = getSupabaseAdminClient();

  const [profileResult, categoriesResult, verificationResult, businessResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", application.applicant_id).maybeSingle(),
    supabase
      .from("seller_application_categories")
      .select("category:categories(id, name, slug)")
      .eq("seller_application_id", application.id),
    supabase
      .from("student_verifications")
      .select("id, student_email, status, verified_at, university:universities(id, name, short_name)")
      .eq("seller_application_id", application.id)
      .maybeSingle(),
    supabase.from("businesses").select("id").eq("source_application_id", application.id).maybeSingle()
  ]);

  if (profileResult.error) throw new Error(`Unable to load applicant profile: ${profileResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Unable to load application categories: ${categoriesResult.error.message}`);
  if (verificationResult.error) throw new Error(`Unable to load student verification: ${verificationResult.error.message}`);
  if (businessResult.error) throw new Error(`Unable to load approved business: ${businessResult.error.message}`);

  const categories = (categoriesResult.data ?? [])
    .map((row: any) => row.category)
    .filter(Boolean) as Array<{ id: string; name: string; slug: string }>;

  return {
    ...application,
    applicant: profileResult.data ?? null,
    categories,
    student_verification: verificationResult.data as AdminSellerApplication["student_verification"],
    business_id: businessResult.data?.id ?? null
  } as AdminSellerApplication;
}

export async function listSellerApplicationsForAdmin(status?: SellerApplicationStatus) {
  const supabase = getSupabaseAdminClient();
  let query = supabase.from("seller_applications").select(applicationFields).order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load seller applications: ${error.message}`);

  return Promise.all((data ?? []).map(hydrateApplication));
}

export async function findSellerApplicationForAdmin(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("seller_applications").select(applicationFields).eq("id", id).maybeSingle();

  if (error) throw new Error(`Unable to load seller application: ${error.message}`);
  if (!data) return null;

  return hydrateApplication(data);
}

export async function reviewSellerApplicationRecord(input: {
  applicationId: string;
  adminId: string;
  decision: "APPROVE" | "REJECT";
  note?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("review_seller_application", {
    p_application_id: input.applicationId,
    p_admin_id: input.adminId,
    p_decision: input.decision,
    p_note: input.note || null
  });

  if (error) {
    const message = error.message ?? "Unable to review seller application.";
    if (message.includes("SELLER_APPLICATION_NOT_FOUND")) return { kind: "NOT_FOUND" as const };
    if (message.includes("SELLER_APPLICATION_NOT_PENDING")) return { kind: "NOT_PENDING" as const };
    if (message.includes("SELLER_APPLICATION_INCOMPLETE")) return { kind: "INCOMPLETE" as const };
    if (message.includes("STUDENT_VERIFICATION_REQUIRED")) return { kind: "STUDENT_VERIFICATION_REQUIRED" as const };
    if (message.includes("ADMIN_REQUIRED")) return { kind: "FORBIDDEN" as const };
    throw new Error(`Unable to review seller application: ${message}`);
  }

  return { kind: "REVIEWED" as const, result: data as ReviewSellerApplicationResult };
}
