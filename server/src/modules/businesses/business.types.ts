export type BusinessType = "STUDENT_BUSINESS" | "OTHER_BUSINESS";
export type BusinessStatus = "ACTIVE" | "DISABLED" | "SUSPENDED";
export type BusinessAvailability = "OPEN" | "UNAVAILABLE";

export interface BusinessRecord {
  id: string;
  owner_id: string;
  source_application_id: string;
  business_type: BusinessType;
  name: string;
  slug: string;
  description: string;
  university_id: string | null;
  location_text: string;
  contact_phone: string;
  social_links: Record<string, string>;
  pickup_enabled: boolean;
  seller_delivery_enabled: boolean;
  logo_path: string | null;
  status: BusinessStatus;
  availability_status: BusinessAvailability;
  approved_at: string;
  created_at: string;
  updated_at: string;
}

export interface ManagedBusiness extends BusinessRecord {
  category_ids: string[];
  categories: Array<{ id: string; name: string; slug: string; is_active: boolean }>;
  university: null | { id: string; name: string; short_name: string | null; slug: string };
}
