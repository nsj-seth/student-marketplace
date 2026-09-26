import { z } from "zod";

export const createReviewSchema = z.object({
  targetType: z.enum(["PRODUCT", "BUSINESS"]),
  sellerOrderId: z.string().uuid(),
  orderItemId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default("")
}).superRefine((value, ctx) => {
  if (value.targetType === "PRODUCT" && !value.orderItemId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["orderItemId"], message: "Product reviews require an order item." });
  }
});
