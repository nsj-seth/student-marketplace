import { z } from "zod";

export const checkoutValidationSchema = z.object({
  customerFullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  location: z.string().trim().min(2).max(300),
  note: z.string().trim().max(1000).optional().default(""),
  fulfilmentSelections: z.array(z.object({
    businessId: z.string().uuid(),
    method: z.enum(["PICKUP", "SELLER_DELIVERY"])
  })).min(1)
});
