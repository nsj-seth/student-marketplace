export type ReviewTargetType = "PRODUCT" | "BUSINESS";

export interface CreateReviewInput {
  targetType: ReviewTargetType;
  sellerOrderId: string;
  orderItemId?: string;
  rating: number;
  comment?: string;
}

export interface PublicReview {
  id: string;
  target_type: ReviewTargetType;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string | null;
  };
}

export interface ReviewCollection {
  average_rating: number | null;
  review_count: number;
  reviews: PublicReview[];
}
