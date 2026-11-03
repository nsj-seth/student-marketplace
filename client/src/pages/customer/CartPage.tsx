import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { clearCart, getCart, removeCartItem, updateCartQuantity, type Cart } from "../../services/cart.service";

function imageUrl(path: string) {
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await getCart();
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function changeQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setBusyItem(itemId);
    setError("");
    try {
      const response = await updateCartQuantity(itemId, quantity);
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update cart.");
    } finally {
      setBusyItem(null);
    }
  }

  async function remove(itemId: string) {
    setBusyItem(itemId);
    setError("");
    try {
      const response = await removeCartItem(itemId);
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove cart item.");
    } finally {
      setBusyItem(null);
    }
  }

  async function clear() {
    setClearing(true);
    setError("");
    try {
      const response = await clearCart();
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear cart.");
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return <main className="wide-shell"><section className="shopping-loading"><div className="shopping-loading__bar" /><p>Loading your cart…</p></section></main>;
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <main className="wide-shell shopping-page">
      <div className="shopping-page__topline">
        <div>
          <span className="eyebrow">Shopping bag</span>
          <h1>Your cart</h1>
          <p>{isEmpty ? "Your next favourite find can start here." : `${cart.item_count} product type${cart.item_count === 1 ? "" : "s"} · ${cart.total_quantity} item${cart.total_quantity === 1 ? "" : "s"}`}</p>
        </div>
        <Link className="shopping-back-link" to="/products">← Continue shopping</Link>
      </div>

      {error && <p className="message message--error">{error}</p>}

      {isEmpty ? (
        <section className="shopping-empty">
          <div className="shopping-empty__icon">🛍</div>
          <span className="eyebrow">Nothing here yet</span>
          <h2>Your cart is waiting for something good.</h2>
          <p>Browse student and community businesses, then add products you want to buy.</p>
          <div className="action-row shopping-empty__actions">
            <Link className="button-link" to="/products">Explore products</Link>
            <Link className="button-link button-link--secondary" to="/businesses">Browse stores</Link>
          </div>
        </section>
      ) : (
        <div className="cart-page-layout">
          <div className="cart-groups cart-groups--premium">
            {cart.groups.map((group) => (
              <section className="cart-group cart-group--premium" key={group.business.id}>
                <header className="cart-store-heading">
                  <div>
                    <span className={`availability-dot ${group.business.availability_status === "OPEN" ? "availability-dot--open" : ""}`} />
                    <div>
                      <Link to={`/businesses/${group.business.slug}`}><h2>{group.business.name}</h2></Link>
                      <p>{group.business.availability_status === "OPEN" ? "Open and accepting orders" : "Currently unavailable"}</p>
                    </div>
                  </div>
                  <strong>{money(group.subtotal)}</strong>
                </header>

                <div className="cart-store-items">
                  {group.items.map((item) => {
                    const image = item.product.images.find((entry) => entry.is_primary) ?? item.product.images[0] ?? null;
                    return (
                      <article className="cart-item cart-item--premium" key={item.id}>
                        <Link className="cart-item__image" to={`/products/${item.product.id}/${item.product.slug}`}>
                          {image ? <img src={imageUrl(image.storage_path)} alt={item.product.name} /> : <div className="cart-image-empty">No image</div>}
                        </Link>
                        <div className="cart-item-main">
                          <span className="cart-item__category">{item.product.category?.name ?? "Product"}</span>
                          <Link to={`/products/${item.product.id}/${item.product.slug}`}><strong>{item.product.name}</strong></Link>
                          <p>{money(item.product.price)} each</p>
                          <span className="cart-item__stock">{item.product.stock_quantity} available</span>
                        </div>
                        <div className="cart-item__controls">
                          <div className="cart-quantity" aria-label={`Quantity for ${item.product.name}`}>
                            <button type="button" aria-label="Decrease quantity" disabled={busyItem === item.id || item.quantity <= 1} onClick={() => void changeQuantity(item.id, item.quantity - 1)}>−</button>
                            <span>{item.quantity}</span>
                            <button type="button" aria-label="Increase quantity" disabled={busyItem === item.id || item.quantity >= item.product.stock_quantity} onClick={() => void changeQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                          <button type="button" className="cart-remove-button" disabled={busyItem === item.id} onClick={() => void remove(item.id)}>{busyItem === item.id ? "Updating…" : "Remove"}</button>
                        </div>
                        <strong className="cart-item__subtotal">{money(item.subtotal)}</strong>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="cart-summary cart-summary--premium">
            <span className="eyebrow">Order summary</span>
            <h2>Ready to check out?</h2>
            <div className="summary-lines">
              <div><span>Product types</span><strong>{cart.item_count}</strong></div>
              <div><span>Total items</span><strong>{cart.total_quantity}</strong></div>
              <div><span>Sellers</span><strong>{cart.groups.length}</strong></div>
            </div>
            <div className="summary-total"><span>Total</span><strong>{money(cart.total)}</strong></div>
            <p className="summary-helper">You’ll choose pickup or seller delivery separately for each business at checkout.</p>
            <Link className="button-link cart-checkout-button" to="/checkout">Continue to checkout →</Link>
            <button type="button" className="secondary-button cart-clear-button" disabled={clearing} onClick={() => void clear()}>{clearing ? "Clearing…" : "Clear cart"}</button>
            <div className="cart-assurance"><span>✓</span><p>Prices and stock are rechecked before your order is created.</p></div>
          </aside>
        </div>
      )}
    </main>
  );
}
