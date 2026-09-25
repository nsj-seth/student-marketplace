import type { BusinessType, SellerApplicationStatus } from "../seller-applications/seller-application.types.js";

export interface AdminSellerApplication {
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
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  applicant: { id: string; full_name: string | null } | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  student_verification: {
    id: string;
    student_email: string;
    status: string;
    verified_at: string | null;
    university: { id: string; name: string; short_name: string | null } | null;
  } | null;
  business_id: string | null;
}

export interface ReviewSellerApplicationResult {
  applicationId: string;
  status: "APPROVED" | "REJECTED";
  businessId: string | null;
}
