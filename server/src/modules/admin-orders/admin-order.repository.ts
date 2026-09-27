import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { CustomerOrderDisplayStatus, SellerOrderStatus } from "../orders/order.types.js";
import type { AdminOrderDetail, AdminOrderListItem } from "./admin-order.types.js";

interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  customer_full_name: string;
  customer_phone: string;
  customer_location: string;
  customer_note: string | null;
  status: string;
  total: string | number;
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
  subtotal: string | number;
  created_at: string;
  updated_at: string;
}

function deriveDisplayStatus(statuses: SellerOrderStatus[]): CustomerOrderDisplayStatus {
  if (statuses.length === 0 || statuses.every((status) => status === "PENDING")) return "PENDING";
  const completed = statuses.filter((status) => status === "COMPLETED").length;
  const failed = statuses.filter((status) => status === "REJECTED" || status === "CANCELLED").length;
  const terminal = completed + failed === statuses.length;
  if (completed === statuses.length) return "COMPLETED";
  if (terminal && completed > 0 && failed > 0) return "PARTIALLY_COMPLETED";
  if (terminal && completed === 0) return "CANCELLED";
  return "IN_PROGRESS";
}

async function loadOrdersAndSellerOrders() {
  const supabase = getSupabaseAdminClient();
  const [{ data: orderData, error: orderError }, { data: sellerData, error: sellerError }] = await Promise.all([
    supabase.from("orders").select("id, order_number, customer_id, customer_full_name, customer_phone, customer_location, customer_note, status, total, created_at, updated_at").order("created_at", { ascending: false }),
    supabase.from("seller_orders").select("id, order_id, business_id, seller_order_number, business_name_snapshot, fulfilment_method, status, subtotal, created_at, updated_at").order("created_at", { ascending: true })
  ]);
  if (orderError) throw new Error(`Unable to load orders: ${orderError.message}`);
  if (sellerError) throw new Error(`Unable to load seller orders: ${sellerError.message}`);
  return { orders: (orderData ?? []) as OrderRow[], sellerOrders: (sellerData ?? []) as SellerOrderRow[] };
}

export async function listAdminOrders(input: {
  search?: string;
  displayStatus?: CustomerOrderDisplayStatus;
  sellerStatus?: SellerOrderStatus;
  page: number;
  limit: number;
}) {
  const { orders, sellerOrders } = await loadOrdersAndSellerOrders();
  const sellerMap = new Map<string, SellerOrderRow[]>();
  for (const sellerOrder of sellerOrders) {
    const current = sellerMap.get(sellerOrder.order_id) ?? [];
    current.push(sellerOrder);
    sellerMap.set(sellerOrder.order_id, current);
  }

  const term = input.search?.toLowerCase();
  const mapped: AdminOrderListItem[] = orders.map((order) => {
    const children = sellerMap.get(order.id) ?? [];
    const statuses = children.map((child) => child.status);
    return {
      id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id,
      customer_name: order.customer_full_name,
      customer_phone: order.customer_phone,
      total: Number(order.total),
      parent_status: order.status,
      display_status: deriveDisplayStatus(statuses),
      created_at: order.created_at,
      updated_at: order.updated_at,
      seller_order_count: children.length,
      business_names: children.map((child) => child.business_name_snapshot),
      seller_statuses: statuses
    };
  });

  const filtered = mapped.filter((order) => {
    if (input.displayStatus && order.display_status !== input.displayStatus) return false;
    if (input.sellerStatus && !order.seller_statuses.includes(input.sellerStatus)) return false;
    if (term) {
      const children = sellerMap.get(order.id) ?? [];
      const haystack = [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        ...order.business_names,
        ...children.map((child) => child.seller_order_number)
      ].join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const start = (input.page - 1) * input.limit;
  return {
    items: filtered.slice(start, start + input.limit),
    page: input.page,
    limit: input.limit,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / input.limit))
  };
}

export async function findAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, customer_full_name, customer_phone, customer_location, customer_note, status, total, created_at, updated_at")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) throw new Error(`Unable to load order: ${orderError.message}`);
  if (!orderData) return null;
  const order = orderData as OrderRow;

  const { data: sellerData, error: sellerError } = await supabase
    .from("seller_orders")
    .select("id, order_id, business_id, seller_order_number, business_name_snapshot, fulfilment_method, status, subtotal, created_at, updated_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (sellerError) throw new Error(`Unable to load seller orders: ${sellerError.message}`);
  const sellerOrders = (sellerData ?? []) as SellerOrderRow[];
  const ids = sellerOrders.map((item) => item.id);

  let items: Array<{ id: string; seller_order_id: string; product_id: string; product_name_snapshot: string; product_slug_snapshot: string; unit_price: number | string; quantity: number; subtotal: number | string }> = [];
  let history: Array<{ id: string; seller_order_id: string; status: SellerOrderStatus; note: string | null; created_at: string }> = [];
  if (ids.length > 0) {
    const [{ data: itemData, error: itemError }, { data: historyData, error: historyError }] = await Promise.all([
      supabase.from("order_items").select("id, seller_order_id, product_id, product_name_snapshot, product_slug_snapshot, unit_price, quantity, subtotal").in("seller_order_id", ids).order("created_at", { ascending: true }),
      supabase.from("order_status_history").select("id, seller_order_id, status, note, created_at").in("seller_order_id", ids).order("created_at", { ascending: true })
    ]);
    if (itemError) throw new Error(`Unable to load order items: ${itemError.message}`);
    if (historyError) throw new Error(`Unable to load order timeline: ${historyError.message}`);
    items = itemData ?? [];
    history = (historyData ?? []) as typeof history;
  }

  const statuses = sellerOrders.map((child) => child.status);
  return {
    id: order.id,
    order_number: order.order_number,
    customer_id: order.customer_id,
    customer_name: order.customer_full_name,
    customer_phone: order.customer_phone,
    customer_location: order.customer_location,
    customer_note: order.customer_note,
    total: Number(order.total),
    parent_status: order.status,
    display_status: deriveDisplayStatus(statuses),
    created_at: order.created_at,
    updated_at: order.updated_at,
    seller_order_count: sellerOrders.length,
    business_names: sellerOrders.map((child) => child.business_name_snapshot),
    seller_statuses: statuses,
    seller_orders: sellerOrders.map((sellerOrder) => ({
      id: sellerOrder.id,
      seller_order_number: sellerOrder.seller_order_number,
      business_id: sellerOrder.business_id,
      business_name: sellerOrder.business_name_snapshot,
      fulfilment_method: sellerOrder.fulfilment_method,
      status: sellerOrder.status,
      subtotal: Number(sellerOrder.subtotal),
      created_at: sellerOrder.created_at,
      updated_at: sellerOrder.updated_at,
      items: items.filter((item) => item.seller_order_id === sellerOrder.id).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name_snapshot,
        product_slug: item.product_slug_snapshot,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal)
      })),
      timeline: history.filter((entry) => entry.seller_order_id === sellerOrder.id).map((entry) => ({
        id: entry.id,
        status: entry.status,
        note: entry.note,
        created_at: entry.created_at
      }))
    }))
  };
}
