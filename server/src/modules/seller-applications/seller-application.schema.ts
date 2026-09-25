import { z } from "zod";

export const businessTypeSchema = z.enum(["STUDENT_BUSINESS", "OTHER_BUSINESS"]);

export const createSellerApplicationSchema = z.object({
  businessType: businessTypeSchema
});

export const updateSellerApplicationTypeSchema = createSellerApplicationSchema;

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();

export const saveSellerApplicationDetailsSchema = z
  .object({
    businessName: z.string().trim().min(2).max(120),
    description: z.string().trim().min(20).max(2000),
    locationText: z.string().trim().min(2).max(200),
    contactPhone: z.string().trim().min(5).max(30),
    categoryIds: z.array(z.string().uuid()).min(1).max(5),
    pickupEnabled: z.boolean(),
    sellerDeliveryEnabled: z.boolean(),
    logoPath: z.string().trim().max(500).nullable().optional(),
    socialLinks: z
      .object({
        instagram: z.string().trim().max(200).optional(),
        facebook: z.string().trim().max(200).optional(),
        whatsapp: z.string().trim().max(100).optional(),
        website: optionalUrl
      })
      .default({})
  })
  .refine((value) => value.pickupEnabled || value.sellerDeliveryEnabled, {
    message: "Choose at least one fulfilment option.",
    path: ["pickupEnabled"]
  });
