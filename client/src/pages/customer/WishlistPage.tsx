import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../services/cart.service";
import { getWishlist, removeFromWishlist, type WishlistItem } from "../../services/wishlist.service";

function imageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function primaryImage(item: WishlistItem) {
  return item.product.images.find((image) => image.is_primary) ?? item.product.images[0] ?? null;
}

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await getWishlist();
      setItems(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function remove(productId: string) {
    setBusyProductId(productId);
    setError("");
    setNotice("");
    try {
      await removeFromWishlist(productId);
      setItems((current) => current.filter((item) => item.product_id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove product from wishlist.");
    } finally {
      setBusyProductId(null);
    }
  }

  async function add(productId: string) {
    setBusyProductId(productId);
    setError("");
    setNotice("");
    try {
      await addToCart(productId, 1);
      setNotice("Added to cart.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add product to cart.");
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <main className="wide-shell wishlist-page">
      <header className="wishlist-hero">
        <div>
          <span className="eyebrow">Saved for later</span>
          <h1>Your wishlist</h1>
          <p>Keep track of the products you’re considering, then move them to your cart when you’re ready.</p>
        </div>
        <div className="wishlist-hero__stat"><strong>{items.length}</strong><span>saved item{items.length === 1 ? "" : "s"}</span></div>
      </header>

      {error && <p className="message message--error">{error}</p>}
      {notice && <p className="message message--success">{notice}</p>}
      {loading && <section className="shopping-loading"><div className="shopping-loading__bar" /><p>Loading saved products…</p></section>}

      {!loading && !error && items.length === 0 && (
        <section className="shopping-empty">
          <div className="shopping-empty__icon">♡</div>
          <span className="eyebrow">No saved products yet</span>
          <h2>Build a shortlist while you browse.</h2>
          <p>Tap the wishlist action on products you want to come back to later.</p>
          <Link className="button-link" to="/products">Discover products</Link>
        </section>
      )}

      {!loading && items.length > 0 && (
        <div className="wishlist-grid">
          {items.map((item) => {
            const image = primaryImage(item);
            const url = image ? imageUrl(image.storage_path) : null;
            const product = item.product;
            const unavailable = product.status === "OUT_OF_STOCK" || product.stock_quantity <= 0;
            return (
              <article className="wishlist-card" key={item.id}>
                <Link className="wishlist-card__image" to={`/products/${product.id}/${product.slug}`}>
                  {url ? <img src={url} alt={image?.alt_text ?? product.name} /> : <div className="product-market-card__empty">No image</div>}
                  <span className={`wishlist-stock ${unavailable ? "wishlist-stock--out" : ""}`}>{unavailable ? "Out of stock" : "In stock"}</span>
                </Link>
                <div className="wishlist-card__body">
                  <span className="eyebrow">{product.category?.name ?? "Product"}</span>
                  <Link className="wishlist-card__title" to={`/products/${product.id}/${product.slug}`}>{product.name}</Link>
                  <p className="product-price">GH₵{product.price.toFixed(2)}</p>
                  <p className="wishlist-card__seller">by <Link to={`/businesses/${product.business.slug}`}>{product.business.name}</Link></p>
                  <div className="wishlist-card__actions">
                    <button type="button" disabled={unavailable || busyProductId === product.id} onClick={() => void add(product.id)}>{busyProductId === product.id ? "Working…" : unavailable ? "Unavailable" : "Add to cart"}</button>
                    <button type="button" className="wishlist-remove" aria-label={`Remove ${product.name} from wishlist`} disabled={busyProductId === product.id} onClick={() => void remove(product.id)}>Remove</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && items.length > 0 && <div className="wishlist-footer"><Link to="/products">← Keep browsing products</Link><Link to="/cart">Go to cart →</Link></div>}
    </main>
  );
}
