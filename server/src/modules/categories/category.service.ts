import { toSlug } from "../../utils/slug.js";
import {
  createCategoryRecord,
  listActiveCategories,
  listAllCategories,
  updateCategoryRecord
} from "./category.repository.js";

export const getPublicCategories = listActiveCategories;
export const getAdminCategories = listAllCategories;

export async function createCategory(input: {
  name: string;
  description?: string | null;
}) {
  return createCategoryRecord({
    ...input,
    slug: toSlug(input.name)
  });
}

export async function updateCategory(
  id: string,
  input: { name?: string; description?: string | null; isActive?: boolean }
) {
  const changes: Record<string, unknown> = {};

  if (input.name !== undefined) {
    changes.name = input.name;
    changes.slug = toSlug(input.name);
  }
  if (input.description !== undefined) changes.description = input.description;
  if (input.isActive !== undefined) changes.is_active = input.isActive;

  return updateCategoryRecord(id, changes);
}

export async function disableCategory(id: string) {
  return updateCategoryRecord(id, { is_active: false });
}
