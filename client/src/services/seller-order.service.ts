import { apiRequest } from "./api";
import type { SellerOrderStatus } from "./order.service";

export type SellerOrderGroup = "pending" | "active" | "completed" | "rejected" | "all";

export interface SellerOrderListItem {
  id: string;
  order_id: string;
  seller_order_number: string;
  parent_order_number: string;
  business_id: string;
  business_name: string;
  fulfilment_method: "PICKUP" | "SELLER_DELIVERY";
  status: SellerOrderStatus;
  subtotal: number;
  customer_full_name: string;
  created_at: string;
  updated_at: string;
}

export interface SellerOrderDetail extends SellerOrderListItem {
  customer: {
    full_name: string;
    phone: string;
    location: string;
    note: string | null;
  };
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_slug: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
  timeline: Array<{
    id: string;
    status: SellerOrderStatus;
    changed_by: string | null;
    note: string | null;
    created_at: string;
  }>;
}

export function getSellerOrders(filters: { businessId?: string; group?: SellerOrderGroup } = {}) {
  const params = new URLSearchParams();
  if (filters.businessId) params.set("businessId", filters.businessId);
  if (filters.group) params.set("group", filters.group);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<SellerOrderListItem[]>(`/seller/orders${suffix}`);
}

export function getSellerOrder(id: string) {
  return apiRequest<SellerOrderDetail>(`/seller/orders/${id}`);
}

export function updateSellerOrderStatus(id: string, status: SellerOrderStatus, note?: string) {
  return apiRequest<SellerOrderDetail>(`/seller/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note: note || null })
  });
}
