import {
  categoryIsAllowedForBusiness,
  createProductImageRecord,
  createProductRecord,
  deleteProductImageRecord,
  findProductForOwnedBusiness,
  findProductImage,
  listProductsForOwnedBusiness,
  reorderImagesRecord,
  setPrimaryImageRecord,
  softRemoveProductRecord,
  updateInventoryRecord,
  updateProductRecord,
  updateStatusRecord
} from "./product.repository.js";

export function getMyBusinessProducts(businessId: string, ownerId: string) {
  return listProductsForOwnedBusiness(businessId, ownerId);
}

export function getMyBusinessProduct(productId: string, businessId: string, ownerId: string) {
  return findProductForOwnedBusiness(productId, businessId, ownerId);
}

export async function createMyProduct(ownerId: string, input: {
  businessId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}) {
  const products = await listProductsForOwnedBusiness(input.businessId, ownerId);
  if (products === null) return { kind: "BUSINESS_NOT_FOUND" as const };
  if (!(await categoryIsAllowedForBusiness(input.businessId, input.categoryId))) {
    return { kind: "INVALID_CATEGORY" as const };
  }
  const product = await createProductRecord(input);
  return { kind: "OK" as const, product };
}

export async function updateMyProduct(productId: string, businessId: string, ownerId: string, input: {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return { kind: "NOT_FOUND" as const };
  if (!(await categoryIsAllowedForBusiness(businessId, input.categoryId))) {
    return { kind: "INVALID_CATEGORY" as const };
  }
  return { kind: "OK" as const, product: await updateProductRecord(product, input) };
}

export async function updateMyProductInventory(productId: string, businessId: string, ownerId: string, quantity: number) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return null;
  return updateInventoryRecord(product, quantity);
}

export async function updateMyProductStatus(productId: string, businessId: string, ownerId: string, status: "ACTIVE" | "INACTIVE") {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return { kind: "NOT_FOUND" as const };
  if (product.status === "HIDDEN") return { kind: "MODERATION_LOCKED" as const };
  return { kind: "OK" as const, product: await updateStatusRecord(product, status) };
}

export async function removeMyProduct(productId: string, businessId: string, ownerId: string) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return false;
  await softRemoveProductRecord(product.id);
  return true;
}

function expectedImagePrefix(ownerId: string, businessId: string, productId: string) {
  return `${ownerId}/businesses/${businessId}/products/${productId}/`;
}

export async function attachMyProductImage(productId: string, businessId: string, ownerId: string, input: { storagePath: string; altText?: string | null }) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return { kind: "NOT_FOUND" as const };
  if (!input.storagePath.startsWith(expectedImagePrefix(ownerId, businessId, productId)) || input.storagePath.includes("..")) {
    return { kind: "INVALID_PATH" as const };
  }
  const result = await createProductImageRecord(product.id, input.storagePath, input.altText?.trim() || null);
  if (result.kind === "LIMIT_REACHED") return result;
  return { kind: "OK" as const, product: await findProductForOwnedBusiness(productId, businessId, ownerId) };
}

export async function reorderMyProductImages(productId: string, businessId: string, ownerId: string, imageIds: string[]) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return { kind: "NOT_FOUND" as const };
  const currentIds = new Set(product.images.map((image) => image.id));
  if (imageIds.length !== currentIds.size || imageIds.some((id) => !currentIds.has(id))) {
    return { kind: "IMAGE_SET_MISMATCH" as const };
  }
  await reorderImagesRecord(productId, imageIds);
  return { kind: "OK" as const, product: await findProductForOwnedBusiness(productId, businessId, ownerId) };
}

export async function setMyPrimaryProductImage(productId: string, businessId: string, ownerId: string, imageId: string) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return { kind: "NOT_FOUND" as const };
  if (!product.images.some((image) => image.id === imageId)) return { kind: "IMAGE_NOT_FOUND" as const };
  await setPrimaryImageRecord(productId, imageId);
  return { kind: "OK" as const, product: await findProductForOwnedBusiness(productId, businessId, ownerId) };
}

export async function removeMyProductImage(productId: string, businessId: string, ownerId: string, imageId: string) {
  const product = await findProductForOwnedBusiness(productId, businessId, ownerId);
  if (!product) return { kind: "NOT_FOUND" as const };
  const image = await findProductImage(productId, imageId);
  if (!image) return { kind: "IMAGE_NOT_FOUND" as const };
  await deleteProductImageRecord(image);
  return { kind: "OK" as const, product: await findProductForOwnedBusiness(productId, businessId, ownerId) };
}
