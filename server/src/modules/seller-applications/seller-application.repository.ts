import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type {
  BusinessType,
  SellerApplicationRecord
} from "./seller-application.types.js";

const selectFields =
  "id, applicant_id, business_type, status, business_name, description, location_text, contact_phone, social_links, pickup_enabled, seller_delivery_enabled, logo_path, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at";

async function attachCategoryIds(application: SellerApplicationRecord | null) {
  if (!application) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_application_categories")
    .select("category_id")
    .eq("seller_application_id", application.id);

  if (error) {
    throw new Error(`Unable to load seller application categories: ${error.message}`);
  }

  return {
    ...application,
    category_ids: (data ?? []).map((row) => row.category_id as string)
  };
}

export async function listApplicationsByApplicant(applicantId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .select(selectFields)
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load seller applications: ${error.message}`);
  }

  return (data ?? []) as SellerApplicationRecord[];
}

export async function findApplicationByIdForApplicant(
  id: string,
  applicantId: string
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .select(selectFields)
    .eq("id", id)
    .eq("applicant_id", applicantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load seller application: ${error.message}`);
  }

  return attachCategoryIds(data as SellerApplicationRecord | null);
}

export async function findDraftByApplicantAndType(
  applicantId: string,
  businessType: BusinessType
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .select(selectFields)
    .eq("applicant_id", applicantId)
    .eq("business_type", businessType)
    .eq("status", "DRAFT")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load seller application draft: ${error.message}`);
  }

  return data as SellerApplicationRecord | null;
}

export async function createApplicationDraft(
  applicantId: string,
  businessType: BusinessType
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .insert({
      applicant_id: applicantId,
      business_type: businessType,
      status: "DRAFT"
    })
    .select(selectFields)
    .single();

  if (error) {
    throw new Error(`Unable to create seller application: ${error.message}`);
  }

  return { ...(data as SellerApplicationRecord), category_ids: [] };
}

export async function updateApplicationDraftType(
  id: string,
  applicantId: string,
  businessType: BusinessType
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .update({ business_type: businessType })
    .eq("id", id)
    .eq("applicant_id", applicantId)
    .eq("status", "DRAFT")
    .select(selectFields)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to update seller application: ${error.message}`);
  }

  return data as SellerApplicationRecord | null;
}

export async function updateApplicationDetails(
  id: string,
  applicantId: string,
  input: {
    businessName: string;
    description: string;
    locationText: string;
    contactPhone: string;
    socialLinks: Record<string, string | undefined>;
    pickupEnabled: boolean;
    sellerDeliveryEnabled: boolean;
    logoPath?: string | null;
    categoryIds: string[];
  }
) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("seller_applications")
    .update({
      business_name: input.businessName,
      description: input.description,
      location_text: input.locationText,
      contact_phone: input.contactPhone,
      social_links: input.socialLinks,
      pickup_enabled: input.pickupEnabled,
      seller_delivery_enabled: input.sellerDeliveryEnabled,
      logo_path: input.logoPath ?? null
    })
    .eq("id", id)
    .eq("applicant_id", applicantId)
    .eq("status", "DRAFT")
    .select(selectFields)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to save seller application details: ${error.message}`);
  }

  if (!data) return null;

  const { error: deleteError } = await supabase
    .from("seller_application_categories")
    .delete()
    .eq("seller_application_id", id);

  if (deleteError) {
    throw new Error(`Unable to update application categories: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase
    .from("seller_application_categories")
    .insert(input.categoryIds.map((categoryId) => ({
      seller_application_id: id,
      category_id: categoryId
    })));

  if (insertError) {
    throw new Error(`Unable to update application categories: ${insertError.message}`);
  }

  return { ...(data as SellerApplicationRecord), category_ids: input.categoryIds };
}

export async function findVerifiedStudentVerification(applicationId: string, applicantId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .select("id, status")
    .eq("seller_application_id", applicationId)
    .eq("applicant_id", applicantId)
    .eq("status", "VERIFIED")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to validate student verification: ${error.message}`);
  }

  return data;
}

export async function categoriesExistAndAreActive(categoryIds: string[]) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .in("id", categoryIds)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Unable to validate categories: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.id as string));
}

export async function submitApplicationRecord(id: string, applicantId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .update({ status: "PENDING", submitted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("applicant_id", applicantId)
    .eq("status", "DRAFT")
    .select(selectFields)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to submit seller application: ${error.message}`);
  }

  return attachCategoryIds(data as SellerApplicationRecord | null);
}
