import { toSlug } from "../../utils/slug.js";
import {
  createUniversityRecord,
  listActiveUniversities,
  listAllUniversities,
  updateUniversityRecord
} from "./university.repository.js";

export const getPublicUniversities = listActiveUniversities;
export const getAdminUniversities = listAllUniversities;

export async function createUniversity(input: {
  name: string;
  shortName?: string | null;
  country: string;
}) {
  return createUniversityRecord({
    ...input,
    slug: toSlug(input.name)
  });
}

export async function updateUniversity(
  id: string,
  input: {
    name?: string;
    shortName?: string | null;
    country?: string;
    isActive?: boolean;
  }
) {
  const changes: Record<string, unknown> = {};

  if (input.name !== undefined) {
    changes.name = input.name;
    changes.slug = toSlug(input.name);
  }
  if (input.shortName !== undefined) changes.short_name = input.shortName;
  if (input.country !== undefined) changes.country = input.country;
  if (input.isActive !== undefined) changes.is_active = input.isActive;

  return updateUniversityRecord(id, changes);
}

export async function disableUniversity(id: string) {
  return updateUniversityRecord(id, { is_active: false });
}
