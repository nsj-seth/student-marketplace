import { useEffect, useState } from "react";
import { getBusinessReviews, getProductReviews, type ReviewCollection } from "../../services/review.service";

type Props =
  | { targetType: "PRODUCT"; targetId: string; title?: string }
  | { targetType: "BUSINESS"; targetId: string; title?: string };

function stars(rating: number) {
  return `${"★".repeat(Math.round(rating))}${"☆".repeat(5 - Math.round(rating))}`;
}

export function PublicReviewsPanel({ targetType, targetId, title = "Reviews & rating" }: Props) {
  const [data, setData] = useState<ReviewCollection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const request = targetType === "PRODUCT" ? getProductReviews(targetId) : getBusinessReviews(targetId);
    void request
      .then((response) => { if (active) setData(response.data ?? { average_rating: null, review_count: 0, reviews: [] }); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load reviews."); });
    return () => { active = false; };
  }, [targetId, targetType]);

  return (
    <section className="reviews-panel">
      <h2>{title}</h2>
      {error && <p className="message message--error">{error}</p>}
      {!data ? <p>Loading reviews...</p> : data.review_count === 0 ? <p>No verified reviews yet.</p> : (
        <>
          <div className="review-summary">
            <strong>{data.average_rating?.toFixed(1)} / 5</strong>
            <span className="review-stars">{stars(data.average_rating ?? 0)}</span>
            <span>{data.review_count} verified review{data.review_count === 1 ? "" : "s"}</span>
          </div>
          <div className="review-list">
            {data.reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card__heading">
                  <strong>{review.reviewer.full_name || "Verified customer"}</strong>
                  <span className="review-stars">{stars(review.rating)}</span>
                </div>
                {review.comment && <p>{review.comment}</p>}
                <small>Verified purchase • {new Date(review.created_at).toLocaleDateString()}</small>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
