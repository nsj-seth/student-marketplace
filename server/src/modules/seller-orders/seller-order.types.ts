export type SellerOrderStatus =
  | "PENDING" | "ACCEPTED" | "PREPARING" | "READY"
  | "OUT_FOR_DELIVERY" | "COMPLETED" | "REJECTED" | "CANCELLED";

export type SellerOrderGroup = "pending" | "active" | "completed" | "rejected" | "all";
