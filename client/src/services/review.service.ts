import { apiRequest } from "./api";

export type ReviewTargetType = "PRODUCT" | "BUSINESS";

export interface PublicReview {
  id: string;
  target_type: ReviewTargetType;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { id: string; full_name: string | null };
}

export interface ReviewCollection {
  average_rating: number | null;
  review_count: number;
  reviews: PublicReview[];
}

export interface ReviewOptions {
  businesses: Array<{
    seller_order_id: string;
    business_id: string;
    business_name: string;
    reviewed: boolean;
    existing_review: { id: string; rating: number } | null;
  }>;
  products: Array<{
    seller_order_id: string;
    order_item_id: string;
    product_id: string;
    product_name: string;
    reviewed: boolean;
    existing_review: { id: string; rating: number } | null;
  }>;
}

export function getProductReviews(productId: string) {
  return apiRequest<ReviewCollection>(`/reviews/products/${encodeURIComponent(productId)}`);
}

export function getBusinessReviews(businessId: string) {
  return apiRequest<ReviewCollection>(`/reviews/businesses/${encodeURIComponent(businessId)}`);
}

export function getOrderReviewOptions(orderId: string) {
  return apiRequest<ReviewOptions>(`/reviews/order/${encodeURIComponent(orderId)}/options`);
}

export function createReview(input: {
  targetType: ReviewTargetType;
  sellerOrderId: string;
  orderItemId?: string;
  rating: number;
  comment?: string;
}) {
  return apiRequest<{ id: string }>("/reviews", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export interface SellerReview {
  id: string;
  target_type: ReviewTargetType;
  target_name: string;
  rating: number;
  comment: string | null;
  status: "ACTIVE" | "HIDDEN" | "REMOVED";
  created_at: string;
  reviewer_name: string;
}

export function getSellerReviews(businessId: string) {
  return apiRequest<SellerReview[]>(`/reviews/seller?businessId=${encodeURIComponent(businessId)}`);
}
