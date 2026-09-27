import { z } from "zod";

export const listAdminBusinessesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]).optional(),
  businessType: z.enum(["STUDENT_BUSINESS", "OTHER_BUSINESS"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const updateAdminBusinessStatusSchema = z.object({
  action: z.enum(["DISABLE", "REACTIVATE"]),
  reason: z.string().trim().max(1000).default("")
}).superRefine((value, ctx) => {
  if (value.action === "DISABLE" && value.reason.length < 3) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "A reason is required when disabling a business." });
  }
});
