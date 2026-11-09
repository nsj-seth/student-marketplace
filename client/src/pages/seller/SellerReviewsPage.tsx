import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, Star, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getMyBusinesses,
  type ManagedBusiness
} from "../../services/business.service";
import {
  getSellerReviews,
  type SellerReview
} from "../../services/review.service";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function SellerReviewsPage() {
  const [businesses, setBusinesses] = useState<ManagedBusiness[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void getMyBusinesses()
      .then((response) => {
        const items = response.data ?? [];
        setBusinesses(items);
        if (items[0]) setBusinessId(items[0].id);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load businesses."
        )
      );
  }, []);

  useEffect(() => {
    if (!businessId) {
      setReviews([]);
      return;
    }

    void getSellerReviews(businessId)
      .then((response) => setReviews(response.data ?? []))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load reviews."
        )
      );
  }, [businessId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviews.length
    );
  }, [reviews]);

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <MessageSquareText className="size-3.5" />
            Seller Hub · Reputation
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.025em]">
            Reviews
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor verified customer feedback across your businesses and products.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <strong className="text-xl">
              {reviews.length > 0 ? averageRating.toFixed(1) : "—"}
            </strong>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="grid max-w-sm gap-1.5 text-xs font-semibold text-muted-foreground">
          Business
          <select
            className={selectClass}
            value={businessId}
            onChange={(event) => setBusinessId(event.target.value)}
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {reviews.length === 0 ? (
        <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
          <MessageSquareText className="size-7 text-primary-text" />
          <h2 className="mt-4 text-xl font-semibold">
            No reviews yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Verified customer reviews for this business will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {reviews.map((review) => (
            <article
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              key={review.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
                    <Store className="size-3.5" />
                    {review.target_type === "BUSINESS"
                      ? "Business review"
                      : "Product review"}
                  </span>
                  <h2 className="mt-1 text-base font-semibold">
                    {review.target_type === "BUSINESS"
                      ? "Your business"
                      : review.target_name}
                  </h2>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        "size-4 " +
                        (index < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30")
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <strong className="block text-sm">
                  {review.reviewer_name}
                </strong>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No written comment.
                  </p>
                )}
              </div>

              <small className="mt-4 block text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleString()}
              </small>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
