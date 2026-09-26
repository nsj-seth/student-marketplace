import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { CheckoutValidationInput } from "../checkout/checkout.types.js";
import type {
  CustomerOrderDetail,
  CustomerOrderDisplayStatus,
  CustomerOrderListItem,
  SellerOrderStatus
} from "./order.types.js";

export interface CreatedOrderSummary {
  orderId: string;
  orderNumber: string;
  total: number;
  sellerOrderCount: number;
  status: "PENDING";
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  customer_full_name: string;
  customer_phone: string;
  customer_location: string;
  customer_note: string | null;
  status: string;
  total: number | string;
  created_at: string;
  updated_at: string;
}

interface SellerOrderRow {
  id: string;
  order_id: string;
  business_id: string;
  seller_order_number: string;
  business_name_snapshot: string;
  fulfilment_method: "PICKUP" | "SELLER_DELIVERY";
  status: SellerOrderStatus;
  subtotal: number | string;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  seller_order_id: string;
  product_id: string;
  product_name_snapshot: string;
  product_slug_snapshot: string;
  unit_price: number | string;
  quantity: number;
  subtotal: number | string;
}

interface HistoryRow {
  id: string;
  seller_order_id: string;
  status: SellerOrderStatus;
  note: string | null;
  created_at: string;
}

function deriveDisplayStatus(statuses: SellerOrderStatus[]): CustomerOrderDisplayStatus {
  if (statuses.length === 0 || statuses.every((status) => status === "PENDING")) return "PENDING";
  if (statuses.every((status) => status === "COMPLETED")) return "COMPLETED";
  if (statuses.every((status) => status === "REJECTED" || status === "CANCELLED")) return "CANCELLED";
  return "IN_PROGRESS";
}

export async function createOrderFromCart(userId: string, input: CheckoutValidationInput): Promise<CreatedOrderSummary> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_marketplace_order", {
    p_user_id: userId,
    p_customer_full_name: input.customerFullName.trim(),
    p_phone: input.phone.trim(),
    p_location: input.location.trim(),
    p_note: input.note?.trim() || null,
    p_fulfilment_selections: input.fulfilmentSelections
  });

  if (error) {
    const message = error.message ?? "Unable to create order.";
    const wrapped = new Error(message);

    if (message.includes("EMPTY_CART")) { wrapped.name = "EMPTY_CART"; wrapped.message = "Your cart is empty or has already been converted into an order."; }
    else if (message.includes("BUSINESS_UNAVAILABLE")) { wrapped.name = "BUSINESS_UNAVAILABLE"; wrapped.message = "A business in your cart is no longer available. Refresh your cart and try again."; }
    else if (message.includes("INSUFFICIENT_STOCK")) { wrapped.name = "INSUFFICIENT_STOCK"; wrapped.message = "Stock changed before checkout completed. Refresh your cart and adjust the affected quantity."; }
    else if (message.includes("PRODUCT_NOT_AVAILABLE")) { wrapped.name = "PRODUCT_NOT_AVAILABLE"; wrapped.message = "A product in your cart is no longer available."; }
    else if (message.includes("INVALID_FULFILMENT_SELECTION")) { wrapped.name = "INVALID_FULFILMENT_SELECTION"; wrapped.message = "One or more fulfilment selections are no longer valid."; }
    else if (message.includes("INVALID_CUSTOMER_NAME") || message.includes("INVALID_PHONE") || message.includes("INVALID_LOCATION")) { wrapped.name = "INVALID_CHECKOUT_DETAILS"; wrapped.message = "Your checkout contact details are invalid."; }
    else wrapped.name = "ORDER_CREATION_FAILED";

    throw wrapped;
  }

  const result = data as Record<string, unknown>;
  return {
    orderId: String(result.orderId),
    orderNumber: String(result.orderNumber),
    total: Number(result.total),
    sellerOrderCount: Number(result.sellerOrderCount),
    status: "PENDING"
  };
}

export async function listCustomerOrders(userId: string): Promise<CustomerOrderListItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, customer_full_name, customer_phone, customer_location, customer_note, status, total, created_at, updated_at")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  if (orderError) throw new Error(`Unable to load orders: ${orderError.message}`);
  const orders = (orderData ?? []) as OrderRow[];
  if (orders.length === 0) return [];

  const { data: sellerData, error: sellerError } = await supabase
    .from("seller_orders")
    .select("id, order_id, business_id, seller_order_number, business_name_snapshot, fulfilment_method, status, subtotal, created_at, updated_at")
    .in("order_id", orders.map((order) => order.id))
    .order("created_at", { ascending: true });

  if (sellerError) throw new Error(`Unable to load seller orders: ${sellerError.message}`);
  const sellerOrders = (sellerData ?? []) as SellerOrderRow[];

  return orders.map((order) => {
    const children = sellerOrders.filter((sellerOrder) => sellerOrder.order_id === order.id);
    return {
      id: order.id,
      order_number: order.order_number,
      total: Number(order.total),
      status: order.status,
      display_status: deriveDisplayStatus(children.map((child) => child.status)),
      created_at: order.created_at,
      businesses: children.map((child) => ({
        id: child.business_id,
        name: child.business_name_snapshot,
        seller_order_number: child.seller_order_number,
        status: child.status,
        subtotal: Number(child.subtotal)
      }))
    };
  });
}

export async function getCustomerOrder(userId: string, orderId: string): Promise<CustomerOrderDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, customer_full_name, customer_phone, customer_location, customer_note, status, total, created_at, updated_at")
    .eq("id", orderId)
    .eq("customer_id", userId)
    .maybeSingle();

  if (orderError) throw new Error(`Unable to load order: ${orderError.message}`);
  if (!orderData) return null;
  const order = orderData as OrderRow;

  const { data: sellerData, error: sellerError } = await supabase
    .from("seller_orders")
    .select("id, order_id, business_id, seller_order_number, business_name_snapshot, fulfilment_method, status, subtotal, created_at, updated_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (sellerError) throw new Error(`Unable to load seller orders: ${sellerError.message}`);
  const sellerOrders = (sellerData ?? []) as SellerOrderRow[];
  const sellerOrderIds = sellerOrders.map((sellerOrder) => sellerOrder.id);

  let items: OrderItemRow[] = [];
  let history: HistoryRow[] = [];

  if (sellerOrderIds.length > 0) {
    const [{ data: itemData, error: itemError }, { data: historyData, error: historyError }] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, seller_order_id, product_id, product_name_snapshot, product_slug_snapshot, unit_price, quantity, subtotal")
        .in("seller_order_id", sellerOrderIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("order_status_history")
        .select("id, seller_order_id, status, note, created_at")
        .in("seller_order_id", sellerOrderIds)
        .order("created_at", { ascending: true })
    ]);

    if (itemError) throw new Error(`Unable to load order items: ${itemError.message}`);
    if (historyError) throw new Error(`Unable to load order timeline: ${historyError.message}`);
    items = (itemData ?? []) as OrderItemRow[];
    history = (historyData ?? []) as HistoryRow[];
  }

  const sellerDetails = sellerOrders.map((sellerOrder) => ({
    id: sellerOrder.id,
    seller_order_number: sellerOrder.seller_order_number,
    business_id: sellerOrder.business_id,
    business_name: sellerOrder.business_name_snapshot,
    fulfilment_method: sellerOrder.fulfilment_method,
    status: sellerOrder.status,
    subtotal: Number(sellerOrder.subtotal),
    created_at: sellerOrder.created_at,
    updated_at: sellerOrder.updated_at,
    items: items
      .filter((item) => item.seller_order_id === sellerOrder.id)
      .map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name_snapshot,
        product_slug: item.product_slug_snapshot,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal)
      })),
    timeline: history
      .filter((entry) => entry.seller_order_id === sellerOrder.id)
      .map((entry) => ({
        id: entry.id,
        status: entry.status,
        note: entry.note,
        created_at: entry.created_at
      }))
  }));

  return {
    id: order.id,
    order_number: order.order_number,
    total: Number(order.total),
    status: order.status,
    display_status: deriveDisplayStatus(sellerOrders.map((sellerOrder) => sellerOrder.status)),
    created_at: order.created_at,
    customer_full_name: order.customer_full_name,
    customer_phone: order.customer_phone,
    customer_location: order.customer_location,
    customer_note: order.customer_note,
    updated_at: order.updated_at,
    businesses: sellerOrders.map((sellerOrder) => ({
      id: sellerOrder.business_id,
      name: sellerOrder.business_name_snapshot,
      seller_order_number: sellerOrder.seller_order_number,
      status: sellerOrder.status,
      subtotal: Number(sellerOrder.subtotal)
    })),
    seller_orders: sellerDetails
  };
}
