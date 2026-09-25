import { apiRequest } from "./api";

export type BusinessType = "STUDENT_BUSINESS" | "OTHER_BUSINESS";

export type SellerApplicationStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CORRECTION_REQUIRED"
  | "SUSPENDED";

export interface SellerApplication {
  id: string;
  applicant_id: string;
  business_type: BusinessType;
  status: SellerApplicationStatus;
  business_name: string | null;
  description: string | null;
  location_text: string | null;
  contact_phone: string | null;
  social_links: Record<string, string>;
  pickup_enabled: boolean;
  seller_delivery_enabled: boolean;
  logo_path: string | null;
  category_ids?: string[];
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerApplicationDetailsInput {
  businessName: string;
  description: string;
  locationText: string;
  contactPhone: string;
  categoryIds: string[];
  pickupEnabled: boolean;
  sellerDeliveryEnabled: boolean;
  logoPath?: string | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };
}

export function getMySellerApplications() {
  return apiRequest<SellerApplication[]>("/seller-applications/mine");
}

export function getMySellerApplication(id: string) {
  return apiRequest<SellerApplication>(`/seller-applications/${id}`);
}

export function createSellerApplication(businessType: BusinessType) {
  return apiRequest<SellerApplication>("/seller-applications", {
    method: "POST",
    body: JSON.stringify({ businessType })
  });
}

export function updateSellerApplicationType(id: string, businessType: BusinessType) {
  return apiRequest<SellerApplication>(`/seller-applications/${id}/type`, {
    method: "PATCH",
    body: JSON.stringify({ businessType })
  });
}

export function saveSellerApplicationDetails(id: string, input: SellerApplicationDetailsInput) {
  return apiRequest<SellerApplication>(`/seller-applications/${id}/details`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function submitSellerApplication(id: string) {
  return apiRequest<SellerApplication>(`/seller-applications/${id}/submit`, {
    method: "POST"
  });
}
