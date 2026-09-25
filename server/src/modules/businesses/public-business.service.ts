import { findPublicBusinessBySlug, listPublicBusinesses } from "./public-business.repository.js";

export function getPublicBusinesses(filters: {
  search?: string;
  category?: string;
  university?: string;
  businessType?: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
  availability?: "OPEN" | "UNAVAILABLE";
}) {
  return listPublicBusinesses(filters);
}

export function getPublicBusiness(slug: string) {
  return findPublicBusinessBySlug(slug);
}
