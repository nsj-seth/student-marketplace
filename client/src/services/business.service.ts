import { apiRequest } from "./api";

export type BusinessType = "STUDENT_BUSINESS" | "OTHER_BUSINESS";
export type BusinessStatus = "ACTIVE" | "DISABLED" | "SUSPENDED";
export type BusinessAvailability = "OPEN" | "UNAVAILABLE";

export interface ManagedBusiness {
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
  category_ids: string[];
  categories: Array<{ id: string; name: string; slug: string; is_active: boolean }>;
  university: null | { id: string; name: string; short_name: string | null; slug: string };
}

export interface UpdateBusinessInput {
  name: string;
  description: string;
  locationText: string;
  contactPhone: string;
  categoryIds: string[];
  pickupEnabled: boolean;
  sellerDeliveryEnabled: boolean;
  logoPath: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };
}

export function getMyBusinesses() {
  return apiRequest<ManagedBusiness[]>("/seller/businesses");
}

export function getMyBusiness(id: string) {
  return apiRequest<ManagedBusiness>(`/seller/businesses/${id}`);
}

export function updateMyBusiness(id: string, input: UpdateBusinessInput) {
  return apiRequest<ManagedBusiness>(`/seller/businesses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function updateMyBusinessAvailability(id: string, availabilityStatus: BusinessAvailability) {
  return apiRequest<ManagedBusiness>(`/seller/businesses/${id}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ availabilityStatus })
  });
}

export interface PublicBusiness {
  id: string;
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
  availability_status: BusinessAvailability;
  approved_at: string;
  created_at: string;
  updated_at: string;
  categories: Array<{ id: string; name: string; slug: string }>;
  university: null | { id: string; name: string; short_name: string | null; slug: string };
}

export interface PublicBusinessFilters {
  search?: string;
  category?: string;
  university?: string;
  businessType?: BusinessType;
  availability?: BusinessAvailability;
  fulfilment?: "PICKUP" | "SELLER_DELIVERY";
  sort?: "NEWEST" | "NAME_A_TO_Z";
}

export function getPublicBusinesses(filters: PublicBusinessFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.university) params.set("university", filters.university);
  if (filters.businessType) params.set("businessType", filters.businessType);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.fulfilment) params.set("fulfilment", filters.fulfilment);
  if (filters.sort) params.set("sort", filters.sort);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<PublicBusiness[]>(`/businesses${suffix}`);
}

export function getPublicBusiness(slug: string) {
  return apiRequest<PublicBusiness>(`/businesses/${encodeURIComponent(slug)}`);
}
