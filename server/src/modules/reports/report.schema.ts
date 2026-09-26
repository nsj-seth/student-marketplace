import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.enum(["PRODUCT", "BUSINESS", "SELLER", "USER"]),
  targetId: z.string().uuid(),
  reason: z.enum(["SPAM", "FRAUD", "INAPPROPRIATE", "MISLEADING", "HARASSMENT", "OTHER"]),
  description: z.string().trim().max(1000).optional().default("")
});

export const listReportsQuerySchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED", "ACTION_TAKEN"]).optional(),
  targetType: z.enum(["PRODUCT", "BUSINESS", "SELLER", "USER"]).optional()
});

export const resolveReportSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED", "ACTION_TAKEN"]),
  action: z.enum(["NONE", "HIDE_PRODUCT", "DISABLE_BUSINESS", "SUSPEND_USER"]).default("NONE"),
  note: z.string().trim().max(1500).optional().default("")
});
