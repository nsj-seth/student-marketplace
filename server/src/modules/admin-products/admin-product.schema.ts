import { z } from "zod";
export const listAdminProductsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE","INACTIVE","OUT_OF_STOCK","HIDDEN","REMOVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});
export const updateAdminProductStatusSchema = z.object({
  action: z.enum(["HIDE", "RESTORE"]),
  reason: z.string().trim().max(1000).default("")
}).superRefine((value, ctx) => {
  if (value.action === "HIDE" && value.reason.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "A reason is required when hiding a product." });
});
