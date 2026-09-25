import {
  categoriesExistAndAreActive,
  createApplicationDraft,
  findApplicationByIdForApplicant,
  findDraftByApplicantAndType,
  findVerifiedStudentVerification,
  listApplicationsByApplicant,
  submitApplicationRecord,
  updateApplicationDetails,
  updateApplicationDraftType
} from "./seller-application.repository.js";
import type { BusinessType } from "./seller-application.types.js";

export function getMySellerApplications(applicantId: string) {
  return listApplicationsByApplicant(applicantId);
}

export function getMySellerApplication(id: string, applicantId: string) {
  return findApplicationByIdForApplicant(id, applicantId);
}

export async function startSellerApplication(
  applicantId: string,
  businessType: BusinessType
) {
  const existingDraft = await findDraftByApplicantAndType(
    applicantId,
    businessType
  );

  if (existingDraft) {
    return existingDraft;
  }

  return createApplicationDraft(applicantId, businessType);
}

export async function changeSellerApplicationType(
  id: string,
  applicantId: string,
  businessType: BusinessType
) {
  const application = await findApplicationByIdForApplicant(id, applicantId);

  if (!application) return { kind: "NOT_FOUND" as const };
  if (application.status !== "DRAFT") return { kind: "NOT_EDITABLE" as const };

  const existingDraft = await findDraftByApplicantAndType(applicantId, businessType);
  if (existingDraft && existingDraft.id !== id) {
    return { kind: "DUPLICATE_DRAFT" as const };
  }

  const updated = await updateApplicationDraftType(id, applicantId, businessType);
  return { kind: "UPDATED" as const, application: updated };
}

export async function saveSellerApplicationDetails(
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
  const application = await findApplicationByIdForApplicant(id, applicantId);
  if (!application) return { kind: "NOT_FOUND" as const };
  if (application.status !== "DRAFT") return { kind: "NOT_EDITABLE" as const };

  if (input.logoPath && !input.logoPath.startsWith(`${applicantId}/${id}/`)) {
    return { kind: "INVALID_LOGO_PATH" as const };
  }

  const validCategories = await categoriesExistAndAreActive(input.categoryIds);
  if (validCategories.size !== new Set(input.categoryIds).size) {
    return { kind: "INVALID_CATEGORY" as const };
  }

  const updated = await updateApplicationDetails(id, applicantId, input);
  return { kind: "UPDATED" as const, application: updated };
}

export async function submitSellerApplication(id: string, applicantId: string) {
  const application = await findApplicationByIdForApplicant(id, applicantId);
  if (!application) return { kind: "NOT_FOUND" as const };
  if (application.status !== "DRAFT") return { kind: "NOT_EDITABLE" as const };

  const complete = Boolean(
    application.business_name &&
    application.description &&
    application.location_text &&
    application.contact_phone &&
    application.logo_path &&
    application.category_ids?.length &&
    (application.pickup_enabled || application.seller_delivery_enabled)
  );

  if (!complete) return { kind: "INCOMPLETE" as const };

  if (application.business_type === "STUDENT_BUSINESS") {
    const verification = await findVerifiedStudentVerification(id, applicantId);
    if (!verification) return { kind: "STUDENT_VERIFICATION_REQUIRED" as const };
  }

  const submitted = await submitApplicationRecord(id, applicantId);
  return { kind: "SUBMITTED" as const, application: submitted };
}
