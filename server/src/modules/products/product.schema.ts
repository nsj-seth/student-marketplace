import { z } from "zod";

const money = z.coerce.number().finite().min(0).max(9999999999.99);
const quantity = z.coerce.number().int().min(0).max(1_000_000_000);

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(1).max(5000),
  price: money,
  quantity,
  categoryId: z.string().uuid()
});

export const updateProductSchema = createProductSchema;

export const updateInventorySchema = z.object({ quantity });

export const updateProductStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"])
});

export const attachProductImageSchema = z.object({
  storagePath: z.string().trim().min(1).max(1000),
  altText: z.string().trim().max(240).nullable().optional()
});

export const reorderProductImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1).max(8)
}).superRefine((value, ctx) => {
  if (new Set(value.imageIds).size !== value.imageIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["imageIds"], message: "Image IDs must be unique." });
  }
});
