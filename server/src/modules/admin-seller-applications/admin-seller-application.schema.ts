import { z } from "zod";

export const adminApplicationStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CORRECTION_REQUIRED",
  "SUSPENDED"
]);

export const reviewSellerApplicationSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    note: z.string().trim().max(1000).optional().default("")
  })
  .refine((value) => value.decision !== "REJECT" || value.note.length >= 3, {
    message: "Provide a short rejection reason.",
    path: ["note"]
  });
