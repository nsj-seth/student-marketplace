import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBusinesses, type ManagedBusiness } from "../../services/business.service";
import { getSellerReviews, type SellerReview } from "../../services/review.service";

function stars(rating: number) { return `${"★".repeat(rating)}${"☆".repeat(5-rating)}`; }

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
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load businesses."));
  }, []);

  useEffect(() => {
    if (!businessId) { setReviews([]); return; }
    void getSellerReviews(businessId)
      .then((response) => setReviews(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load reviews."));
  }, [businessId]);

  return (
    <main className="wide-shell seller-hub-page">
      <section className="card wide-card">
        <div className="section-heading"><div><span className="eyebrow">Seller Hub · Reputation</span><h1>Reviews</h1></div><Link to="/seller/businesses">My businesses</Link></div>
        {error && <p className="message message--error">{error}</p>}
        <label>Business<select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
        {reviews.length === 0 ? <p>No reviews for this business yet.</p> : (
          <div className="review-list">
            {reviews.map((review) => <article className="review-card" key={review.id}><div className="review-card__heading"><strong>{review.target_type === "BUSINESS" ? "Business" : `Product: ${review.target_name}`}</strong><span className="review-stars">{stars(review.rating)}</span></div><p><strong>{review.reviewer_name}</strong></p>{review.comment && <p>{review.comment}</p>}<small>{new Date(review.created_at).toLocaleString()}</small></article>)}
          </div>
        )}
      </section>
    </main>
  );
}
