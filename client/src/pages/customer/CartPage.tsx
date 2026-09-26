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
    setError("");
    try {
      const response = await clearCart();
      setCart(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear cart.");
    }
  }

  if (loading) return <main className="wide-shell"><section className="card wide-card"><p>Loading cart...</p></section></main>;

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <div className="section-heading">
          <div><span className="eyebrow">Shopping</span><h1>My cart</h1></div>
          <Link to="/products">Continue shopping</Link>
        </div>

        {error && <p className="message message--error">{error}</p>}

        {!cart || cart.items.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add products from the marketplace and they will appear here.</p>
            <Link className="button-link" to="/products">Browse products</Link>
          </div>
        ) : (
          <>
            <p>{cart.item_count} product type(s) • {cart.total_quantity} total item(s)</p>
            <div className="cart-groups">
              {cart.groups.map((group) => (
                <section className="cart-group" key={group.business.id}>
                  <div className="section-heading">
                    <div><h2>{group.business.name}</h2><p>{group.business.availability_status === "OPEN" ? "Currently open" : "Currently unavailable"}</p></div>
                    <strong>{money(group.subtotal)}</strong>
                  </div>

                  {group.items.map((item) => {
                    const image = item.product.images.find((entry) => entry.is_primary) ?? item.product.images[0] ?? null;
                    return (
                      <article className="cart-item" key={item.id}>
                        {image ? <img src={imageUrl(image.storage_path)} alt={item.product.name} /> : <div className="cart-image-empty">No image</div>}
                        <div className="cart-item-main">
                          <Link to={`/products/${item.product.id}/${item.product.slug}`}><strong>{item.product.name}</strong></Link>
                          <p>{money(item.product.price)} each</p>
                          <p>Available: {item.product.stock_quantity}</p>
                        </div>
                        <div className="cart-quantity">
                          <button type="button" disabled={busyItem === item.id || item.quantity <= 1} onClick={() => void changeQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button type="button" disabled={busyItem === item.id || item.quantity >= item.product.stock_quantity} onClick={() => void changeQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <strong>{money(item.subtotal)}</strong>
                        <button type="button" className="secondary-button" disabled={busyItem === item.id} onClick={() => void remove(item.id)}>Remove</button>
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>

            <section className="cart-summary">
              <div><span>Total</span><strong>{money(cart.total)}</strong></div>
              <p>Checkout and fulfilment selection will be added in the next checkout phase.</p>
              <button type="button" disabled>Checkout (coming next)</button>
              <button type="button" className="secondary-button" onClick={() => void clear()}>Clear cart</button>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
