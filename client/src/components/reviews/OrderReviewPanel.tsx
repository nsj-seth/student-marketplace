import { useEffect, useState } from "react";
import { createReview, getOrderReviewOptions, type ReviewOptions, type ReviewTargetType } from "../../services/review.service";

interface DraftState {
  rating: number;
  comment: string;
}

const emptyDraft: DraftState = { rating: 5, comment: "" };

export function OrderReviewPanel({ orderId }: { orderId: string }) {
  const [options, setOptions] = useState<ReviewOptions | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await getOrderReviewOptions(orderId);
    setOptions(response.data ?? { businesses: [], products: [] });
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load review options."));
  }, [orderId]);

  function draft(key: string) {
    return drafts[key] ?? emptyDraft;
  }

  function updateDraft(key: string, patch: Partial<DraftState>) {
    setDrafts((current) => ({ ...current, [key]: { ...draft(key), ...patch } }));
  }

  async function submit(targetType: ReviewTargetType, sellerOrderId: string, key: string, orderItemId?: string) {
    setSavingKey(key);
    setError("");
    setMessage("");
    try {
      const value = draft(key);
      await createReview({ targetType, sellerOrderId, orderItemId, rating: value.rating, comment: value.comment });
      setMessage("Review submitted. Thank you.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSavingKey(null);
    }
  }

  if (!options) return <section className="reviews-panel"><h2>Leave a review</h2><p>Loading review options...</p></section>;
  if (options.businesses.length === 0 && options.products.length === 0) return null;

  return (
    <section className="reviews-panel order-review-panel">
      <h2>Leave a verified review</h2>
      <p className="muted-text">Reviews are available only for completed purchases.</p>
      {message && <p className="message message--success">{message}</p>}
      {error && <p className="message message--error">{error}</p>}

      {options.businesses.map((item) => {
        const key = `business-${item.seller_order_id}`;
        return (
          <article className="review-form-card" key={key}>
            <h3>Business: {item.business_name}</h3>
            {item.reviewed ? <p>Reviewed ✓ ({item.existing_review?.rating}/5)</p> : (
              <ReviewForm
                value={draft(key)}
                saving={savingKey === key}
                onChange={(patch) => updateDraft(key, patch)}
                onSubmit={() => void submit("BUSINESS", item.seller_order_id, key)}
              />
            )}
          </article>
        );
      })}

      {options.products.map((item) => {
        const key = `product-${item.order_item_id}`;
        return (
          <article className="review-form-card" key={key}>
            <h3>Product: {item.product_name}</h3>
            {item.reviewed ? <p>Reviewed ✓ ({item.existing_review?.rating}/5)</p> : (
              <ReviewForm
                value={draft(key)}
                saving={savingKey === key}
                onChange={(patch) => updateDraft(key, patch)}
                onSubmit={() => void submit("PRODUCT", item.seller_order_id, key, item.order_item_id)}
              />
            )}
          </article>
        );
      })}
    </section>
  );
}

function ReviewForm({ value, saving, onChange, onSubmit }: {
  value: DraftState;
  saving: boolean;
  onChange: (patch: Partial<DraftState>) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="review-form">
      <label>
        Rating
        <select value={value.rating} onChange={(event) => onChange({ rating: Number(event.target.value) })}>
          <option value={5}>5 — Excellent</option>
          <option value={4}>4 — Good</option>
          <option value={3}>3 — Okay</option>
          <option value={2}>2 — Poor</option>
          <option value={1}>1 — Very poor</option>
        </select>
      </label>
      <label>
        Comment (optional)
        <textarea maxLength={2000} rows={3} value={value.comment} onChange={(event) => onChange({ comment: event.target.value })} />
      </label>
      <button type="button" disabled={saving} onClick={onSubmit}>{saving ? "Submitting..." : "Submit review"}</button>
    </div>
  );
}
