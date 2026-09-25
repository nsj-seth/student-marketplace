import { z } from "zod";

export const requestStudentVerificationSchema = z.object({
  sellerApplicationId: z.string().uuid(),
  universityId: z.string().uuid(),
  studentEmail: z.string().trim().email().max(320)
});

export const confirmStudentVerificationSchema = z.object({
  sellerApplicationId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, "Verification code must be 6 digits.")
});
