import { z } from "zod";

export const listAdminOrdersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  displayStatus: z.enum(["PENDING", "IN_PROGRESS", "PARTIALLY_COMPLETED", "COMPLETED", "CANCELLED"]).optional(),
  sellerStatus: z.enum(["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "REJECTED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});
