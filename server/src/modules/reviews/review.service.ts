import type { CreateReviewInput } from "./review.types.js";
import { createVerifiedReview, getOrderReviewOptions, listBusinessReviews, listProductReviews, listSellerReviews } from "./review.repository.js";

export const createReview = (userId: string, input: CreateReviewInput) => createVerifiedReview(userId, input);
export const getProductReviews = (productId: string) => listProductReviews(productId);
export const getBusinessReviews = (businessId: string) => listBusinessReviews(businessId);
export const getReviewOptionsForOrder = (userId: string, orderId: string) => getOrderReviewOptions(userId, orderId);

export const getReviewsForSellerBusiness = (userId: string, businessId: string) => listSellerReviews(userId, businessId);
