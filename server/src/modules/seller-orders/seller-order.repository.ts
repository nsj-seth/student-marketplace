import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { SellerOrderGroup, SellerOrderStatus } from "./seller-order.types.js";

const groupStatuses: Record<Exclude<SellerOrderGroup, "all">, SellerOrderStatus[]> = {
  pending: ["PENDING"],
  active: ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"],
  completed: ["COMPLETED"],
  rejected: ["REJECTED", "CANCELLED"]
};

export async function listSellerOrders(userId: string, businessId?: string, group: SellerOrderGroup = "all") {
  const supabase = getSupabaseAdminClient();
  let businessQuery = supabase.from("businesses").select("id, name").eq("owner_id", userId);
  if (businessId) businessQuery = businessQuery.eq("id", businessId);
  const { data: businesses, error: businessError } = await businessQuery;
  if (businessError) throw new Error(`Unable to load seller businesses: ${businessError.message}`);

  const businessRows = (businesses ?? []) as Array<{ id: string; name: string }>;
  if (businessRows.length === 0) return [];
  const ids = businessRows.map((row) => row.id);
  const names = new Map(businessRows.map((row) => [row.id, row.name]));

  let query = supabase
    .from("seller_orders")
    .select("id, order_id, business_id, seller_order_number, business_name_snapshot, fulfilment_method, status, subtotal, created_at, updated_at, orders!inner(order_number, customer_full_name, customer_phone, customer_location, created_at)")
    .in("business_id", ids)
    .order("created_at", { ascending: false });

  if (group !== "all") query = query.in("status", groupStatuses[group]);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load seller orders: ${error.message}`);

  return (data ?? []).map((row: any) => {
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    return {
      id: row.id,
      order_id: row.order_id,
      seller_order_number: row.seller_order_number,
      parent_order_number: order?.order_number ?? "",
      business_id: row.business_id,
      business_name: names.get(row.business_id) ?? row.business_name_snapshot,
      fulfilment_method: row.fulfilment_method,
      status: row.status,
      subtotal: Number(row.subtotal),
      customer_full_name: order?.customer_full_name ?? "",
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  });
}

export async function getSellerOrder(userId: string, sellerOrderId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: row, error } = await supabase
    .from("seller_orders")
    .select("id, order_id, business_id, seller_order_number, business_name_snapshot, fulfilment_method, status, subtotal, created_at, updated_at, businesses!inner(owner_id, name), orders!inner(order_number, customer_full_name, customer_phone, customer_location, customer_note, created_at)")
    .eq("id", sellerOrderId)
    .eq("businesses.owner_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load seller order: ${error.message}`);
  if (!row) return null;

  const [{ data: items, error: itemError }, { data: timeline, error: timelineError }] = await Promise.all([
    supabase.from("order_items").select("id, product_id, product_name_snapshot, product_slug_snapshot, unit_price, quantity, subtotal").eq("seller_order_id", sellerOrderId).order("created_at"),
    supabase.from("order_status_history").select("id, status, changed_by, note, created_at").eq("seller_order_id", sellerOrderId).order("created_at")
  ]);
  if (itemError) throw new Error(`Unable to load seller order items: ${itemError.message}`);
  if (timelineError) throw new Error(`Unable to load seller order timeline: ${timelineError.message}`);

  const order: any = Array.isArray((row as any).orders) ? (row as any).orders[0] : (row as any).orders;
  const business: any = Array.isArray((row as any).businesses) ? (row as any).businesses[0] : (row as any).businesses;

  return {
    id: row.id,
    order_id: row.order_id,
    seller_order_number: row.seller_order_number,
    parent_order_number: order?.order_number ?? "",
    business_id: row.business_id,
    business_name: business?.name ?? row.business_name_snapshot,
    fulfilment_method: row.fulfilment_method,
    status: row.status,
    subtotal: Number(row.subtotal),
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer: {
      full_name: order?.customer_full_name ?? "",
      phone: order?.customer_phone ?? "",
      location: order?.customer_location ?? "",
      note: order?.customer_note ?? null
    },
    items: (items ?? []).map((item: any) => ({ ...item, product_name: item.product_name_snapshot, product_slug: item.product_slug_snapshot, unit_price: Number(item.unit_price), subtotal: Number(item.subtotal) })),
    timeline: timeline ?? []
  };
}

export async function transitionSellerOrder(userId: string, sellerOrderId: string, status: string, note?: string | null) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("transition_seller_order_status", {
    p_seller_order_id: sellerOrderId,
    p_seller_id: userId,
    p_new_status: status,
    p_note: note ?? null
  });
  if (error) {
    const message = error.message ?? "Unable to update seller order.";
    const names = ["SELLER_ORDER_NOT_FOUND", "SELLER_ORDER_TERMINAL", "INVALID_ORDER_TRANSITION", "REJECTION_REASON_REQUIRED"];
    const matched = names.find((name) => message.includes(name));
    const err = new Error(matched ? matched.replaceAll("_", " ").toLowerCase() : message);
    err.name = matched ?? "SELLER_ORDER_UPDATE_FAILED";
    throw err;
  }
  return getSellerOrder(userId, sellerOrderId);
}
