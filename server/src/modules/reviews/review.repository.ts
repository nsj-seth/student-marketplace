import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { CreateReviewInput, PublicReview, ReviewCollection } from "./review.types.js";

function reviewError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

async function assertCompletedSellerOrderOwnedByUser(userId: string, sellerOrderId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: sellerOrder, error } = await supabase
    .from("seller_orders")
    .select("id, order_id, business_id, business_name_snapshot, status")
    .eq("id", sellerOrderId)
    .maybeSingle();

  if (error) throw new Error(`Unable to validate purchase: ${error.message}`);
  if (!sellerOrder) throw reviewError("PURCHASE_NOT_FOUND", "The completed purchase could not be found.");
  if (sellerOrder.status !== "COMPLETED") throw reviewError("REVIEW_NOT_ALLOWED", "Reviews can only be left after the seller order is completed.");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", sellerOrder.order_id)
    .maybeSingle();

  if (orderError) throw new Error(`Unable to validate order owner: ${orderError.message}`);
  if (!order || order.customer_id !== userId) throw reviewError("PURCHASE_NOT_FOUND", "The completed purchase could not be found.");

  return sellerOrder as {
    id: string;
    order_id: string;
    business_id: string;
    business_name_snapshot: string;
    status: "COMPLETED";
  };
}

export async function createVerifiedReview(userId: string, input: CreateReviewInput) {
  const supabase = getSupabaseAdminClient();
  const sellerOrder = await assertCompletedSellerOrderOwnedByUser(userId, input.sellerOrderId);

  let productId: string | null = null;
  let orderItemId: string | null = null;
  let businessId: string | null = null;

  if (input.targetType === "PRODUCT") {
    const { data: item, error } = await supabase
      .from("order_items")
      .select("id, seller_order_id, product_id")
      .eq("id", input.orderItemId!)
      .maybeSingle();

    if (error) throw new Error(`Unable to validate purchased product: ${error.message}`);
    if (!item || item.seller_order_id !== sellerOrder.id) {
      throw reviewError("PURCHASE_NOT_FOUND", "That product was not part of this completed seller order.");
    }
    productId = item.product_id as string;
    orderItemId = item.id as string;
  } else {
    businessId = sellerOrder.business_id;
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_id: userId,
      target_type: input.targetType,
      product_id: productId,
      business_id: businessId,
      order_item_id: orderItemId,
      seller_order_id: sellerOrder.id,
      rating: input.rating,
      comment: input.comment?.trim() || null
    })
    .select("id, target_type, product_id, business_id, order_item_id, seller_order_id, rating, comment, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw reviewError("REVIEW_ALREADY_EXISTS", "You have already reviewed this completed purchase.");
    throw new Error(`Unable to create review: ${error.message}`);
  }
  return data;
}

async function publicReviews(column: "product_id" | "business_id", targetId: string): Promise<ReviewCollection> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, reviewer_id, target_type, rating, comment, created_at")
    .eq(column, targetId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Unable to load reviews: ${error.message}`);
  const rows = data ?? [];
  const reviewerIds = [...new Set(rows.map((row) => row.reviewer_id as string))];
  const profileMap = new Map<string, { id: string; full_name: string | null }>();

  if (reviewerIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reviewerIds);
    if (profileError) throw new Error(`Unable to load review authors: ${profileError.message}`);
    for (const profile of profiles ?? []) profileMap.set(profile.id as string, profile as { id: string; full_name: string | null });
  }

  const reviews: PublicReview[] = rows.map((row) => ({
    id: row.id as string,
    target_type: row.target_type as "PRODUCT" | "BUSINESS",
    rating: Number(row.rating),
    comment: (row.comment as string | null) ?? null,
    created_at: row.created_at as string,
    reviewer: profileMap.get(row.reviewer_id as string) ?? { id: row.reviewer_id as string, full_name: null }
  }));

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  return {
    average_rating: average === null ? null : Math.round(average * 10) / 10,
    review_count: reviews.length,
    reviews
  };
}

export function listProductReviews(productId: string) {
  return publicReviews("product_id", productId);
}

export function listBusinessReviews(businessId: string) {
  return publicReviews("business_id", businessId);
}

export async function getOrderReviewOptions(userId: string, orderId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) throw new Error(`Unable to load order: ${orderError.message}`);
  if (!order || order.customer_id !== userId) throw reviewError("ORDER_NOT_FOUND", "Order not found.");

  const { data: sellerOrders, error: sellerError } = await supabase
    .from("seller_orders")
    .select("id, business_id, business_name_snapshot, status")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (sellerError) throw new Error(`Unable to load seller orders: ${sellerError.message}`);

  const completed = (sellerOrders ?? []).filter((row) => row.status === "COMPLETED");
  if (!completed.length) return { businesses: [], products: [] };

  const sellerOrderIds = completed.map((row) => row.id as string);
  const { data: items, error: itemError } = await supabase
    .from("order_items")
    .select("id, seller_order_id, product_id, product_name_snapshot")
    .in("seller_order_id", sellerOrderIds);
  if (itemError) throw new Error(`Unable to load purchased items: ${itemError.message}`);

  const { data: existing, error: reviewErrorResult } = await supabase
    .from("reviews")
    .select("id, target_type, seller_order_id, order_item_id, rating")
    .eq("reviewer_id", userId)
    .in("seller_order_id", sellerOrderIds);
  if (reviewErrorResult) throw new Error(`Unable to load existing reviews: ${reviewErrorResult.message}`);

  const businessReviewMap = new Map<string, { id: string; rating: number }>();
  const productReviewMap = new Map<string, { id: string; rating: number }>();
  for (const review of existing ?? []) {
    if (review.target_type === "BUSINESS") businessReviewMap.set(review.seller_order_id as string, { id: review.id as string, rating: Number(review.rating) });
    if (review.target_type === "PRODUCT" && review.order_item_id) productReviewMap.set(review.order_item_id as string, { id: review.id as string, rating: Number(review.rating) });
  }

  return {
    businesses: completed.map((row) => ({
      seller_order_id: row.id as string,
      business_id: row.business_id as string,
      business_name: row.business_name_snapshot as string,
      reviewed: businessReviewMap.has(row.id as string),
      existing_review: businessReviewMap.get(row.id as string) ?? null
    })),
    products: (items ?? []).map((item) => ({
      seller_order_id: item.seller_order_id as string,
      order_item_id: item.id as string,
      product_id: item.product_id as string,
      product_name: item.product_name_snapshot as string,
      reviewed: productReviewMap.has(item.id as string),
      existing_review: productReviewMap.get(item.id as string) ?? null
    }))
  };
}


export async function listSellerReviews(userId: string, businessId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, owner_id, name")
    .eq("id", businessId)
    .maybeSingle();
  if (businessError) throw new Error(`Unable to validate business: ${businessError.message}`);
  if (!business || business.owner_id !== userId) throw reviewError("BUSINESS_NOT_FOUND", "Business not found.");

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name")
    .eq("business_id", businessId);
  if (productError) throw new Error(`Unable to load business products: ${productError.message}`);
  const productIds = (products ?? []).map((row) => row.id as string);
  const productNameMap = new Map((products ?? []).map((row) => [row.id as string, row.name as string]));

  const filters = [`business_id.eq.${businessId}`];
  if (productIds.length) filters.push(`product_id.in.(${productIds.join(",")})`);

  const { data: reviews, error: reviewQueryError } = await supabase
    .from("reviews")
    .select("id, reviewer_id, target_type, product_id, business_id, rating, comment, status, created_at")
    .or(filters.join(","))
    .order("created_at", { ascending: false });
  if (reviewQueryError) throw new Error(`Unable to load seller reviews: ${reviewQueryError.message}`);

  const reviewerIds = [...new Set((reviews ?? []).map((row) => row.reviewer_id as string))];
  const profileMap = new Map<string, string | null>();
  if (reviewerIds.length) {
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name").in("id", reviewerIds);
    if (profileError) throw new Error(`Unable to load review authors: ${profileError.message}`);
    for (const profile of profiles ?? []) profileMap.set(profile.id as string, (profile.full_name as string | null) ?? null);
  }

  return (reviews ?? []).map((row) => ({
    id: row.id as string,
    target_type: row.target_type as "PRODUCT" | "BUSINESS",
    target_name: row.target_type === "BUSINESS" ? (business.name as string) : productNameMap.get(row.product_id as string) ?? "Product",
    rating: Number(row.rating),
    comment: (row.comment as string | null) ?? null,
    status: row.status as "ACTIVE" | "HIDDEN" | "REMOVED",
    created_at: row.created_at as string,
    reviewer_name: profileMap.get(row.reviewer_id as string) ?? "Verified customer"
  }));
}
