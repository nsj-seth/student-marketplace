import type { CheckoutValidationInput } from "../checkout/checkout.types.js";
import { createOrderFromCart, getCustomerOrder, listCustomerOrders } from "./order.repository.js";

export function placeOrder(userId: string, input: CheckoutValidationInput) {
  return createOrderFromCart(userId, input);
}

export function getMyOrders(userId: string) {
  return listCustomerOrders(userId);
}

export async function getMyOrder(userId: string, orderId: string) {
  const order = await getCustomerOrder(userId, orderId);
  if (!order) {
    const error = new Error("Order not found.");
    error.name = "ORDER_NOT_FOUND";
    throw error;
  }
  return order;
}
