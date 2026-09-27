export interface AdminOverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  customers: number;
  sellers: number;
  studentBusinesses: number;
  otherBusinesses: number;
  totalBusinesses: number;
  activeBusinesses: number;
  totalProducts: number;
  publicProducts: number;
  totalOrders: number;
  completedOrders: number;
  pendingSellerApplications: number;
  pendingReports: number;
  ordersLast30Days: number;
  orderValueLast30Days: number;
}

export interface AdminRecentOrder {
  id: string;
  order_number: string;
  customer_full_name: string;
  status: string;
  total: number;
  created_at: string;
  seller_order_count: number;
}

export interface AdminStatusCount {
  status: string;
  count: number;
}

export interface AdminTopBusiness {
  business_id: string;
  business_name: string;
  completed_orders: number;
  completed_value: number;
}

export interface AdminDashboardData {
  metrics: AdminOverviewMetrics;
  orderStatusBreakdown: AdminStatusCount[];
  sellerOrderStatusBreakdown: AdminStatusCount[];
  recentOrders: AdminRecentOrder[];
  topBusinesses: AdminTopBusiness[];
}
