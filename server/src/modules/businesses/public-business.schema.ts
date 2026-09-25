import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

export const publicBusinessListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  category: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  university: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  businessType: z.preprocess(
    emptyToUndefined,
    z.enum(["STUDENT_BUSINESS", "OTHER_BUSINESS"]).optional()
  ),
  availability: z.preprocess(emptyToUndefined, z.enum(["OPEN", "UNAVAILABLE"]).optional())
});
