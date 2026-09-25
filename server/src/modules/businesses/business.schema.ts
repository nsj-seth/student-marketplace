import { z } from "zod";

const optionalLink = z.string().trim().max(300).optional().or(z.literal(""));

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
  locationText: z.string().trim().min(2).max(250),
  contactPhone: z.string().trim().min(5).max(40),
  categoryIds: z.array(z.string().uuid()).min(1).max(5),
  pickupEnabled: z.boolean(),
  sellerDeliveryEnabled: z.boolean(),
  logoPath: z.string().trim().min(1).max(500),
  socialLinks: z.object({
    instagram: optionalLink,
    facebook: optionalLink,
    whatsapp: optionalLink,
    website: optionalLink
  }).default({})
}).refine((data) => data.pickupEnabled || data.sellerDeliveryEnabled, {
  message: "At least one fulfilment option is required.",
  path: ["pickupEnabled"]
});

export const updateAvailabilitySchema = z.object({
  availabilityStatus: z.enum(["OPEN", "UNAVAILABLE"])
});
