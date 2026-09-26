import { getSellerOrder, listSellerOrders, transitionSellerOrder } from "./seller-order.repository.js";
import type { SellerOrderGroup } from "./seller-order.types.js";

export function getMySellerOrders(userId: string, businessId?: string, group: SellerOrderGroup = "all") {
  return listSellerOrders(userId, businessId, group);
}

export async function getMySellerOrder(userId: string, id: string) {
  const order = await getSellerOrder(userId, id);
  if (!order) {
    const error = new Error("Seller order not found.");
    error.name = "SELLER_ORDER_NOT_FOUND";
    throw error;
  }
  return order;
}

export function updateMySellerOrderStatus(userId: string, id: string, status: string, note?: string | null) {
  return transitionSellerOrder(userId, id, status, note);
}
