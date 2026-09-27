import { apiRequest } from "./api";

export type SellerOrderStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "COMPLETED" | "REJECTED" | "CANCELLED";
export type OrderDisplayStatus = "PENDING" | "IN_PROGRESS" | "PARTIALLY_COMPLETED" | "COMPLETED" | "CANCELLED";

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  parent_status: string;
  display_status: OrderDisplayStatus;
  created_at: string;
  updated_at: string;
  seller_order_count: number;
  business_names: string[];
  seller_statuses: SellerOrderStatus[];
}

export interface AdminOrderDetail extends AdminOrderListItem {
  customer_location: string;
  customer_note: string | null;
  seller_orders: Array<{
    id: string;
    seller_order_number: string;
    business_id: string;
    business_name: string;
    fulfilment_method: "PICKUP" | "SELLER_DELIVERY";
    status: SellerOrderStatus;
    subtotal: number;
    created_at: string;
    updated_at: string;
    items: Array<{ id: string; product_id: string; product_name: string; product_slug: string; unit_price: number; quantity: number; subtotal: number }>;
    timeline: Array<{ id: string; status: SellerOrderStatus; note: string | null; created_at: string }>;
  }>;
}

export interface AdminOrderListData {
  items: AdminOrderListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getAdminOrders(filters: { search?: string; displayStatus?: OrderDisplayStatus; sellerStatus?: SellerOrderStatus; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.displayStatus) params.set("displayStatus", filters.displayStatus);
  if (filters.sellerStatus) params.set("sellerStatus", filters.sellerStatus);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return apiRequest<AdminOrderListData>(`/admin/orders${query ? `?${query}` : ""}`);
}

export function getAdminOrder(id: string) {
  return apiRequest<AdminOrderDetail>(`/admin/orders/${id}`);
}
