import { z } from "zod";

export const createUniversitySchema = z.object({
  name: z.string().trim().min(2).max(160),
  shortName: z.string().trim().min(1).max(30).optional().nullable(),
  country: z.string().trim().min(2).max(80).default("Ghana")
});

export const updateUniversitySchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    shortName: z.string().trim().min(1).max(30).optional().nullable(),
    country: z.string().trim().min(2).max(80).optional(),
    isActive: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });
