import { z } from "zod";

export const wishlistProductParamSchema = z.object({
  productId: z.string().uuid("Invalid product ID.")
});

export const addWishlistItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID.")
});
