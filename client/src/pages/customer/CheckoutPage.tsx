import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createOrder, getCheckoutPreview, type CheckoutPreview, type CreatedOrderSummary, type FulfilmentMethod } from "../../services/checkout.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;

export function CheckoutPage() {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderSummary | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [selections, setSelections] = useState<Record<string, FulfilmentMethod | "">>({});

  useEffect(() => {
    void getCheckoutPreview()
      .then((response) => {
        const data = response.data ?? null;
        setPreview(data);
        if (!data) return;
        setFullName(data.customer.full_name ?? "");
        setSelections(Object.fromEntries(data.groups.map((group) => [group.business.id, group.available_fulfilment_methods.length === 1 ? group.available_fulfilment_methods[0] : ""])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to prepare checkout."))
      .finally(() => setLoading(false));
  }, []);

  const allSelected = useMemo(() => preview ? preview.groups.every((group) => Boolean(selections[group.business.id])) : false, [preview, selections]);
  const detailsReady = fullName.trim().length >= 2 && phone.trim().length >= 7 && location.trim().length >= 2;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!preview) return;
    setError("");
    setCreatedOrder(null);
    setSubmitting(true);
    try {
      const response = await createOrder({
        customerFullName: fullName,
        phone,
        location,
        note,
        fulfilmentSelections: preview.groups.map((group) => ({ businessId: group.business.id, method: selections[group.business.id] as FulfilmentMethod }))
      });
      if (!response.data) throw new Error("Order was created but no confirmation was returned.");
      setCreatedOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="wide-shell"><section className="shopping-loading"><div className="shopping-loading__bar" /><p>Preparing a secure checkout…</p></section></main>;

  if (!preview) {
    return <main className="wide-shell"><section className="shopping-empty"><div className="shopping-empty__icon">↩</div><h1>Checkout isn’t ready</h1>{error && <p className="message message--error">{error}</p>}<Link className="button-link" to="/cart">Back to cart</Link></section></main>;
  }

  if (createdOrder) {
    return (
      <main className="wide-shell checkout-success-page">
        <section className="checkout-success-card">
          <div className="checkout-success-card__icon">✓</div>
          <span className="eyebrow">Order placed</span>
          <h1>Thanks, your order is in.</h1>
          <p className="checkout-success-card__number">{createdOrder.orderNumber}</p>
          <p>Your checkout was split into <strong>{createdOrder.sellerOrderCount}</strong> seller order{createdOrder.sellerOrderCount === 1 ? "" : "s"} so each business can fulfil its part independently.</p>
          <div className="checkout-success-stats"><div><span>Total</span><strong>{money(createdOrder.total)}</strong></div><div><span>Status</span><strong>{createdOrder.status}</strong></div></div>
          <div className="checkout-success-actions"><Link className="button-link" to={`/orders/${createdOrder.orderId}`}>Track this order</Link><Link className="button-link button-link--secondary" to="/orders">All orders</Link></div>
          <Link className="checkout-success-shop" to="/products">Continue shopping →</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="wide-shell checkout-page">
      <div className="shopping-page__topline">
        <div><span className="eyebrow">Checkout</span><h1>Complete your order</h1><p>Confirm your details and choose how each seller should fulfil their part.</p></div>
        <Link className="shopping-back-link" to="/cart">← Back to cart</Link>
      </div>

      <div className="checkout-progress" aria-label="Checkout progress"><div className="checkout-progress__step checkout-progress__step--done"><span>1</span><strong>Cart</strong></div><i /><div className="checkout-progress__step checkout-progress__step--active"><span>2</span><strong>Details & fulfilment</strong></div><i /><div className="checkout-progress__step"><span>3</span><strong>Order placed</strong></div></div>

      {error && <p className="message message--error">{error}</p>}

      <form className="checkout-layout checkout-layout--premium" onSubmit={submit}>
        <div className="checkout-main checkout-main--premium">
          <section className="checkout-section checkout-section--premium">
            <div className="checkout-section__heading"><span>01</span><div><h2>Your details</h2><p>We’ll attach these details to the seller-specific orders.</p></div></div>
            <div className="checkout-form-grid">
              <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={120} placeholder="Your full name" /></label>
              <label>Email<input value={preview.customer.email} disabled /></label>
              <label>Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} required minLength={7} maxLength={30} placeholder="e.g. 024 000 0000" /></label>
              <label className="checkout-form-grid__wide">Delivery / pickup location<textarea value={location} onChange={(event) => setLocation(event.target.value)} required minLength={2} maxLength={300} placeholder="Hostel, hall, landmark, neighbourhood or pickup instructions" /></label>
              <label className="checkout-form-grid__wide">Order note <span>Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Anything useful for the sellers to know" /></label>
            </div>
          </section>

          <section className="checkout-section checkout-section--premium">
            <div className="checkout-section__heading"><span>02</span><div><h2>Fulfilment by seller</h2><p>Your cart contains {preview.groups.length} seller{preview.groups.length === 1 ? "" : "s"}. Choose separately for each one.</p></div></div>
            <div className="checkout-business-list">
              {preview.groups.map((group) => (
                <article className="checkout-business checkout-business--premium" key={group.business.id}>
                  <div className="checkout-business__top"><div><h3>{group.business.name}</h3><p>{group.business.location_text}</p></div><strong>{money(group.subtotal)}</strong></div>
                  <div className="checkout-items-summary checkout-items-summary--premium">{group.items.map((item) => <span key={item.id}><b>{item.quantity}×</b> {item.product.name}</span>)}</div>
                  <div className="fulfilment-options fulfilment-options--cards">
                    {group.available_fulfilment_methods.includes("PICKUP") && (
                      <label className={selections[group.business.id] === "PICKUP" ? "fulfilment-card fulfilment-card--selected" : "fulfilment-card"}>
                        <input type="radio" name={`fulfilment-${group.business.id}`} value="PICKUP" checked={selections[group.business.id] === "PICKUP"} onChange={() => setSelections((current) => ({ ...current, [group.business.id]: "PICKUP" }))} />
                        <span className="fulfilment-card__icon">⌂</span><span><strong>Customer pickup</strong><small>Collect directly from the seller.</small></span>
                      </label>
                    )}
                    {group.available_fulfilment_methods.includes("SELLER_DELIVERY") && (
                      <label className={selections[group.business.id] === "SELLER_DELIVERY" ? "fulfilment-card fulfilment-card--selected" : "fulfilment-card"}>
                        <input type="radio" name={`fulfilment-${group.business.id}`} value="SELLER_DELIVERY" checked={selections[group.business.id] === "SELLER_DELIVERY"} onChange={() => setSelections((current) => ({ ...current, [group.business.id]: "SELLER_DELIVERY" }))} />
                        <span className="fulfilment-card__icon">→</span><span><strong>Seller delivery</strong><small>The seller arranges delivery with you.</small></span>
                      </label>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="checkout-summary checkout-summary--premium">
          <span className="eyebrow">Order summary</span>
          <h2>{preview.total_quantity} item{preview.total_quantity === 1 ? "" : "s"}</h2>
          <div className="checkout-summary__stores">{preview.groups.map((group) => <div key={group.business.id}><span>{group.business.name}</span><strong>{money(group.subtotal)}</strong></div>)}</div>
          <div className="summary-lines"><div><span>Product types</span><strong>{preview.item_count}</strong></div><div><span>Sellers</span><strong>{preview.groups.length}</strong></div></div>
          <div className="summary-total"><span>Total</span><strong>{money(preview.total)}</strong></div>
          {!allSelected && <p className="checkout-summary__hint">Choose a fulfilment method for every seller.</p>}
          {!detailsReady && <p className="checkout-summary__hint">Complete your name, phone and location.</p>}
          <button type="submit" className="checkout-submit" disabled={submitting || !allSelected || !detailsReady}>{submitting ? "Placing order…" : "Place order"}</button>
          <p className="checkout-note">No payment is collected in this MVP. Prices, availability and stock are revalidated when the order is placed.</p>
          <div className="cart-assurance"><span>✓</span><p>Your cart becomes an order only after all server-side checks succeed.</p></div>
        </aside>
      </form>
    </main>
  );
}
