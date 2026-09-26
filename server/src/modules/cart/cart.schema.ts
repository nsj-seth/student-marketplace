import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1)
});

export const cartItemParamSchema = z.object({
  itemId: z.string().uuid()
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99)
});
