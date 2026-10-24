import assert from "node:assert/strict";
import test from "node:test";
import { addCartItemSchema, updateCartItemSchema } from "../src/modules/cart/cart.schema.js";
import { checkoutValidationSchema } from "../src/modules/checkout/checkout.schema.js";
import { createProductSchema, reorderProductImagesSchema } from "../src/modules/products/product.schema.js";
import { sellerOrderStatusSchema } from "../src/modules/seller-orders/seller-order.schema.js";

const uuid = "123e4567-e89b-12d3-a456-426614174000";

test("cart rejects zero, negative, and oversized quantities", () => {
  assert.equal(addCartItemSchema.safeParse({ productId: uuid, quantity: 0 }).success, false);
  assert.equal(updateCartItemSchema.safeParse({ quantity: -1 }).success, false);
  assert.equal(updateCartItemSchema.safeParse({ quantity: 100 }).success, false);
});

test("product schema rejects negative prices and quantities", () => {
  assert.equal(createProductSchema.safeParse({ name: "Test", description: "x", price: -1, quantity: 1, categoryId: uuid }).success, false);
  assert.equal(createProductSchema.safeParse({ name: "Test", description: "x", price: 1, quantity: -1, categoryId: uuid }).success, false);
});

test("image reorder rejects duplicate IDs", () => {
  assert.equal(reorderProductImagesSchema.safeParse({ imageIds: [uuid, uuid] }).success, false);
});

test("checkout requires customer details and at least one fulfilment selection", () => {
  assert.equal(checkoutValidationSchema.safeParse({ customerFullName: "A", phone: "1", location: "", fulfilmentSelections: [] }).success, false);
});

test("seller order schema only accepts known operational statuses", () => {
  assert.equal(sellerOrderStatusSchema.safeParse({ status: "COMPLETED" }).success, true);
  assert.equal(sellerOrderStatusSchema.safeParse({ status: "ADMIN_OVERRIDE" }).success, false);
});
