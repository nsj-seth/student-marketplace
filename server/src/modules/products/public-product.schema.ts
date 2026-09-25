import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalMoney = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).max(1000000000).optional()
);

export const publicProductListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  category: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  business: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  university: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  businessType: z.preprocess(emptyToUndefined, z.enum(["STUDENT_BUSINESS", "OTHER_BUSINESS"]).optional()),
  availability: z.preprocess(emptyToUndefined, z.enum(["OPEN", "UNAVAILABLE"]).optional()),
  stock: z.preprocess(emptyToUndefined, z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional()),
  fulfilment: z.preprocess(emptyToUndefined, z.enum(["PICKUP", "SELLER_DELIVERY"]).optional()),
  minPrice: optionalMoney,
  maxPrice: optionalMoney,
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["NEWEST", "PRICE_LOW_TO_HIGH", "PRICE_HIGH_TO_LOW", "NAME_A_TO_Z"]).optional()
  )
}).refine((data) => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice, {
  message: "Minimum price cannot be greater than maximum price.",
  path: ["maxPrice"]
});
