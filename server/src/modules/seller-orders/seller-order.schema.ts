import { z } from "zod";

export const sellerOrderListQuerySchema = z.object({
  businessId: z.string().uuid().optional(),
  group: z.enum(["pending", "active", "completed", "rejected", "all"]).default("all")
});

export const sellerOrderStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "REJECTED"]),
  note: z.string().trim().max(500).optional().nullable()
});
