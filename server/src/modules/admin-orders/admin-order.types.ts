import type { CustomerOrderDisplayStatus, SellerOrderStatus } from "../orders/order.types.js";

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  parent_status: string;
  display_status: CustomerOrderDisplayStatus;
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
      note: string | null;
      created_at: string;
    }>;
  }>;
}
