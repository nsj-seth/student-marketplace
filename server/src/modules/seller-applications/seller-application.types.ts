export type BusinessType = "STUDENT_BUSINESS" | "OTHER_BUSINESS";

export type SellerApplicationStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CORRECTION_REQUIRED"
  | "SUSPENDED";

export interface SellerApplicationRecord {
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
