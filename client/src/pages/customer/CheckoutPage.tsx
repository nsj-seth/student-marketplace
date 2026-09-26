import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createOrder,
  getCheckoutPreview,
  type CheckoutPreview,
  type CreatedOrderSummary,
  type FulfilmentMethod
} from "../../services/checkout.service";

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
        setSelections(Object.fromEntries(data.groups.map((group) => [
          group.business.id,
          group.available_fulfilment_methods.length === 1 ? group.available_fulfilment_methods[0] : ""
        ])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to prepare checkout."))
      .finally(() => setLoading(false));
  }, []);

  const allSelected = useMemo(() => {
    if (!preview) return false;
    return preview.groups.every((group) => Boolean(selections[group.business.id]));
  }, [preview, selections]);

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
        fulfilmentSelections: preview.groups.map((group) => ({
          businessId: group.business.id,
          method: selections[group.business.id] as FulfilmentMethod
        }))
      });
      if (!response.data) throw new Error("Order was created but no confirmation was returned.");
      setCreatedOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="wide-shell"><section className="card wide-card"><p>Preparing checkout...</p></section></main>;
  }

  if (!preview) {
    return (
      <main className="wide-shell">
        <section className="card wide-card">
          <h1>Checkout</h1>
          {error && <p className="message message--error">{error}</p>}
          <Link to="/cart">Back to cart</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <div className="section-heading">
          <div><span className="eyebrow">Checkout</span><h1>Confirm your details</h1></div>
          <Link to="/cart">Back to cart</Link>
        </div>

        {error && <p className="message message--error">{error}</p>}
        {createdOrder ? (
          <section className="checkout-confirmation">
            <span className="eyebrow">Order placed</span>
            <h2>{createdOrder.orderNumber}</h2>
            <p>Your order was created successfully and split into {createdOrder.sellerOrderCount} seller order(s).</p>
            <p><strong>Total: {money(createdOrder.total)}</strong></p>
            <p>Status: {createdOrder.status}</p>
            <p>You can now follow each seller-specific part of this order from My Orders.</p>
            <div className="action-row">
              <Link className="button-link" to={`/orders/${createdOrder.orderId}`}>View order</Link>
              <Link to="/orders">My Orders</Link>
              <Link to="/products">Continue shopping</Link>
            </div>
          </section>
        ) : (
        <form className="checkout-layout" onSubmit={submit}>
          <div className="checkout-main">
            <section className="checkout-section">
              <h2>Customer information</h2>
              <label>
                Full name
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={120} />
              </label>
              <label>
                Email
                <input value={preview.customer.email} disabled />
              </label>
              <label>
                Phone number
                <input value={phone} onChange={(event) => setPhone(event.target.value)} required minLength={7} maxLength={30} placeholder="e.g. 024 000 0000" />
              </label>
              <label>
                Delivery / pickup location
                <textarea value={location} onChange={(event) => setLocation(event.target.value)} required minLength={2} maxLength={300} placeholder="Describe the location or pickup arrangement" />
              </label>
              <label>
                Order note (optional)
                <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Any useful information for the sellers" />
              </label>
            </section>

            <section className="checkout-section">
              <h2>Fulfilment by business</h2>
              <p>Because your cart may contain multiple sellers, choose fulfilment separately for each business.</p>

              {preview.groups.map((group) => (
                <article className="checkout-business" key={group.business.id}>
                  <div className="section-heading">
                    <div><h3>{group.business.name}</h3><p>{group.business.location_text}</p></div>
                    <strong>{money(group.subtotal)}</strong>
                  </div>

                  <div className="checkout-items-summary">
                    {group.items.map((item) => (
                      <span key={item.id}>{item.quantity} × {item.product.name}</span>
                    ))}
                  </div>

                  <div className="fulfilment-options">
                    {group.available_fulfilment_methods.includes("PICKUP") && (
                      <label>
                        <input
                          type="radio"
                          name={`fulfilment-${group.business.id}`}
                          value="PICKUP"
                          checked={selections[group.business.id] === "PICKUP"}
                          onChange={() => setSelections((current) => ({ ...current, [group.business.id]: "PICKUP" }))}
                        />
                        Customer Pickup
                      </label>
                    )}
                    {group.available_fulfilment_methods.includes("SELLER_DELIVERY") && (
                      <label>
                        <input
                          type="radio"
                          name={`fulfilment-${group.business.id}`}
                          value="SELLER_DELIVERY"
                          checked={selections[group.business.id] === "SELLER_DELIVERY"}
                          onChange={() => setSelections((current) => ({ ...current, [group.business.id]: "SELLER_DELIVERY" }))}
                        />
                        Seller Delivery
                      </label>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </div>

          <aside className="checkout-summary">
            <h2>Order summary</h2>
            <p>{preview.item_count} product type(s)</p>
            <p>{preview.total_quantity} total item(s)</p>
            <div><span>Total</span><strong>{money(preview.total)}</strong></div>
            <button type="submit" disabled={submitting || !allSelected}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <p className="checkout-note">No payment is collected in the MVP. Stock and prices are revalidated when you place the order.</p>
          </aside>
        </form>
        )}
      </section>
    </main>
  );
}
