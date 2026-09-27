import { z } from "zod";

export const updateFeaturedSchema = z.object({
  featured: z.boolean()
});
