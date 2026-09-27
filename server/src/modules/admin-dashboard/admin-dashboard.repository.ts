import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { AdminDashboardData, AdminRecentOrder, AdminStatusCount, AdminTopBusiness } from "./admin-dashboard.types.js";

function countOf(result: { count: number | null; error: { message: string } | null }, label: string) {
  if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message}`);
  return result.count ?? 0;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdminClient();
  const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsersResult,
    activeUsersResult,
    suspendedUsersResult,
    customerRolesResult,
    sellerRolesResult,
    studentBusinessesResult,
    otherBusinessesResult,
    totalBusinessesResult,
    activeBusinessesResult,
    totalProductsResult,
    publicProductsResult,
    totalOrdersResult,
    completedOrdersResult,
    pendingApplicationsResult,
    pendingReportsResult,
    orders30Result,
    recentOrdersResult,
    orderStatusesResult,
    sellerOrderStatusesResult,
    sellerOrders30ValueResult,
    completedSellerOrdersResult
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "ACTIVE"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "SUSPENDED"),
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "CUSTOMER"),
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "SELLER"),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("business_type", "STUDENT_BUSINESS"),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("business_type", "OTHER_BUSINESS"),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("products").select("id", { count: "exact", head: true }).neq("status", "REMOVED"),
    supabase.from("products").select("id, businesses!inner(status)", { count: "exact", head: true }).in("status", ["ACTIVE", "OUT_OF_STOCK"]).eq("businesses.status", "ACTIVE"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
    supabase.from("seller_applications").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since30Days),
    supabase.from("orders").select("id, order_number, customer_full_name, status, total, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("orders").select("status"),
    supabase.from("seller_orders").select("status"),
    supabase.from("orders").select("total").gte("created_at", since30Days),
    supabase.from("seller_orders").select("business_id, subtotal").eq("status", "COMPLETED")
  ]);

  const recentError = recentOrdersResult.error;
  if (recentError) throw new Error(`Unable to load recent orders: ${recentError.message}`);
  if (orderStatusesResult.error) throw new Error(`Unable to load order status analytics: ${orderStatusesResult.error.message}`);
  if (sellerOrderStatusesResult.error) throw new Error(`Unable to load seller order analytics: ${sellerOrderStatusesResult.error.message}`);
  if (sellerOrders30ValueResult.error) throw new Error(`Unable to load order value analytics: ${sellerOrders30ValueResult.error.message}`);
  if (completedSellerOrdersResult.error) throw new Error(`Unable to load business analytics: ${completedSellerOrdersResult.error.message}`);

  const recentRows = recentOrdersResult.data ?? [];
  const recentOrderIds = recentRows.map((row) => row.id as string);
  const { data: recentSellerOrders, error: recentSellerOrdersError } = recentOrderIds.length
    ? await supabase.from("seller_orders").select("order_id").in("order_id", recentOrderIds)
    : { data: [], error: null };
  if (recentSellerOrdersError) throw new Error(`Unable to load recent seller orders: ${recentSellerOrdersError.message}`);

  const sellerOrderCounts = new Map<string, number>();
  for (const row of recentSellerOrders ?? []) {
    const orderId = row.order_id as string;
    sellerOrderCounts.set(orderId, (sellerOrderCounts.get(orderId) ?? 0) + 1);
  }

  const recentOrders: AdminRecentOrder[] = recentRows.map((row) => ({
    id: row.id as string,
    order_number: row.order_number as string,
    customer_full_name: row.customer_full_name as string,
    status: row.status as string,
    total: Number(row.total),
    created_at: row.created_at as string,
    seller_order_count: sellerOrderCounts.get(row.id as string) ?? 0
  }));

  function breakdown(rows: Array<{ status: unknown }>): AdminStatusCount[] {
    const map = new Map<string, number>();
    for (const row of rows) {
      const status = String(row.status);
      map.set(status, (map.get(status) ?? 0) + 1);
    }
    return [...map.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
  }

  const businessStats = new Map<string, { completed_orders: number; completed_value: number }>();
  for (const row of completedSellerOrdersResult.data ?? []) {
    const id = row.business_id as string;
    const current = businessStats.get(id) ?? { completed_orders: 0, completed_value: 0 };
    current.completed_orders += 1;
    current.completed_value += Number(row.subtotal);
    businessStats.set(id, current);
  }

  const topIds = [...businessStats.entries()]
    .sort((a, b) => b[1].completed_value - a[1].completed_value)
    .slice(0, 5)
    .map(([id]) => id);
  const { data: topBusinessRows, error: topBusinessError } = topIds.length
    ? await supabase.from("businesses").select("id, name").in("id", topIds)
    : { data: [], error: null };
  if (topBusinessError) throw new Error(`Unable to load top businesses: ${topBusinessError.message}`);
  const topBusinessNames = new Map((topBusinessRows ?? []).map((row) => [row.id as string, row.name as string]));
  const topBusinesses: AdminTopBusiness[] = topIds.map((id) => ({
    business_id: id,
    business_name: topBusinessNames.get(id) ?? "Unknown business",
    completed_orders: businessStats.get(id)?.completed_orders ?? 0,
    completed_value: businessStats.get(id)?.completed_value ?? 0
  }));

  return {
    metrics: {
      totalUsers: countOf(totalUsersResult, "total users"),
      activeUsers: countOf(activeUsersResult, "active users"),
      suspendedUsers: countOf(suspendedUsersResult, "suspended users"),
      customers: countOf(customerRolesResult, "customers"),
      sellers: countOf(sellerRolesResult, "sellers"),
      studentBusinesses: countOf(studentBusinessesResult, "student businesses"),
      otherBusinesses: countOf(otherBusinessesResult, "other businesses"),
      totalBusinesses: countOf(totalBusinessesResult, "businesses"),
      activeBusinesses: countOf(activeBusinessesResult, "active businesses"),
      totalProducts: countOf(totalProductsResult, "products"),
      publicProducts: countOf(publicProductsResult, "public products"),
      totalOrders: countOf(totalOrdersResult, "orders"),
      completedOrders: countOf(completedOrdersResult, "completed orders"),
      pendingSellerApplications: countOf(pendingApplicationsResult, "pending seller applications"),
      pendingReports: countOf(pendingReportsResult, "pending reports"),
      ordersLast30Days: countOf(orders30Result, "recent orders"),
      orderValueLast30Days: (sellerOrders30ValueResult.data ?? []).reduce((sum, row) => sum + Number(row.total), 0)
    },
    orderStatusBreakdown: breakdown((orderStatusesResult.data ?? []) as Array<{ status: unknown }>),
    sellerOrderStatusBreakdown: breakdown((sellerOrderStatusesResult.data ?? []) as Array<{ status: unknown }>),
    recentOrders,
    topBusinesses
  };
}
