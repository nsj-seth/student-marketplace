import { z } from "zod";

export const listAdminUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["CUSTOMER", "SELLER", "ADMIN"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const updateAdminUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().trim().max(1000).optional().default("")
}).superRefine((value, ctx) => {
  if (value.status === "SUSPENDED" && value.reason.length < 3) {
    ctx.addIssue({ code: "custom", path: ["reason"], message: "A short suspension reason is required." });
  }
});
