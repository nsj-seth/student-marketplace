export type SellerOrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type CustomerOrderDisplayStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PARTIALLY_COMPLETED"
  | "COMPLETED"
  | "CANCELLED";

export interface CustomerOrderBusinessSummary {
  id: string;
  name: string;
  seller_order_number: string;
  status: SellerOrderStatus;
  subtotal: number;
  progress_percent: number;
  progress_label: string;
  rejection_reason: string | null;
}

export interface CustomerOrderListItem {
  id: string;
  order_number: string;
  total: number;
  status: string;
  display_status: CustomerOrderDisplayStatus;
  status_summary: string;
  created_at: string;
  seller_order_count: number;
  completed_count: number;
  rejected_count: number;
  active_count: number;
  businesses: CustomerOrderBusinessSummary[];
}

export interface CustomerOrderDetail extends CustomerOrderListItem {
  customer_full_name: string;
  customer_phone: string;
  customer_location: string;
  customer_note: string | null;
  updated_at: string;
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
    progress_percent: number;
    progress_label: string;
    rejection_reason: string | null;
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
