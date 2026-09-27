import type { BusinessAvailability, BusinessStatus, BusinessType } from "../businesses/business.types.js";

export interface AdminBusinessRecord {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string | null;
  business_type: BusinessType;
  name: string;
  slug: string;
  description: string;
  university_id: string | null;
  university_name: string | null;
  location_text: string;
  contact_phone: string;
  status: BusinessStatus;
  availability_status: BusinessAvailability;
  product_count: number;
  created_at: string;
  updated_at: string;
  admin_status_reason: string | null;
  admin_status_changed_at: string | null;
}
