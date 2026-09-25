import { findPublicBusinessBySlug, listPublicBusinesses } from "./public-business.repository.js";

export function getPublicBusinesses(filters: Parameters<typeof listPublicBusinesses>[0]) {
  return listPublicBusinesses(filters);
}

export function getPublicBusiness(slug: string) {
  return findPublicBusinessBySlug(slug);
}
