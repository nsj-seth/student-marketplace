import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { PublicStudentVerification, StudentVerificationRecord } from "./student-verification.types.js";

const selectFields =
  "id, applicant_id, seller_application_id, university_id, student_email, status, verification_method, code_expires_at, attempt_count, last_sent_at, verified_at, created_at, updated_at";

export async function findVerificationForApplication(
  sellerApplicationId: string,
  applicantId: string
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .select(`${selectFields}, university:universities(id, name, short_name)`)
    .eq("seller_application_id", sellerApplicationId)
    .eq("applicant_id", applicantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load student verification: ${error.message}`);
  }

  return data as PublicStudentVerification | null;
}

export async function findVerificationSecretsForApplication(
  sellerApplicationId: string,
  applicantId: string
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .select(`${selectFields}, code_hash`)
    .eq("seller_application_id", sellerApplicationId)
    .eq("applicant_id", applicantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load student verification: ${error.message}`);
  }

  return data as (StudentVerificationRecord & { code_hash: string | null }) | null;
}

export async function universityExistsAndIsActive(universityId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .select("id")
    .eq("id", universityId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to validate university: ${error.message}`);
  }

  return Boolean(data);
}

export async function upsertVerificationChallenge(input: {
  applicantId: string;
  sellerApplicationId: string;
  universityId: string;
  studentEmail: string;
  codeHash: string;
  codeExpiresAt: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .upsert(
      {
        applicant_id: input.applicantId,
        seller_application_id: input.sellerApplicationId,
        university_id: input.universityId,
        student_email: input.studentEmail.toLowerCase(),
        status: "UNVERIFIED",
        verification_method: "EMAIL_CODE",
        code_hash: input.codeHash,
        code_expires_at: input.codeExpiresAt,
        attempt_count: 0,
        last_sent_at: new Date().toISOString(),
        verified_at: null
      },
      { onConflict: "seller_application_id" }
    )
    .select(selectFields)
    .single();

  if (error) {
    throw new Error(`Unable to create student verification: ${error.message}`);
  }

  return data as StudentVerificationRecord;
}

export async function recordFailedAttempt(
  verificationId: string,
  attemptCount: number,
  failed: boolean
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("student_verifications")
    .update({
      attempt_count: attemptCount,
      ...(failed ? { status: "FAILED" } : {})
    })
    .eq("id", verificationId);

  if (error) {
    throw new Error(`Unable to update verification attempt: ${error.message}`);
  }
}

export async function markVerificationVerified(verificationId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .update({
      status: "VERIFIED",
      verified_at: new Date().toISOString(),
      code_hash: null,
      code_expires_at: null
    })
    .eq("id", verificationId)
    .select(selectFields)
    .single();

  if (error) {
    throw new Error(`Unable to complete student verification: ${error.message}`);
  }

  return data as StudentVerificationRecord;
}
