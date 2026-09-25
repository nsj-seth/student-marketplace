import {
  findBusinessOwnedBy,
  listBusinessesOwnedBy,
  updateOwnedBusinessAvailability,
  updateOwnedBusinessRecord
} from "./business.repository.js";
import type { BusinessAvailability } from "./business.types.js";

export function getMyBusinesses(ownerId: string) {
  return listBusinessesOwnedBy(ownerId);
}

export function getMyBusiness(id: string, ownerId: string) {
  return findBusinessOwnedBy(id, ownerId);
}

export async function updateMyBusiness(
  id: string,
  ownerId: string,
  input: {
    name: string;
    description: string;
    locationText: string;
    contactPhone: string;
    categoryIds: string[];
    pickupEnabled: boolean;
    sellerDeliveryEnabled: boolean;
    logoPath: string;
    socialLinks: Record<string, string | undefined>;
  }
) {
  const existing = await findBusinessOwnedBy(id, ownerId);
  if (!existing) return null;
  return updateOwnedBusinessRecord(id, ownerId, input);
}

export async function setMyBusinessAvailability(
  id: string,
  ownerId: string,
  availabilityStatus: BusinessAvailability
) {
  const existing = await findBusinessOwnedBy(id, ownerId);
  if (!existing) return null;
  return updateOwnedBusinessAvailability(id, ownerId, availabilityStatus);
}
