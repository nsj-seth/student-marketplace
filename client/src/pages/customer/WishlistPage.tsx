import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
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

  useEffect(() => {
    void load();
  }, []);

  async function remove(productId: string) {
    setBusyProductId(productId);
    setError("");
    try {
      await removeFromWishlist(productId);
      setItems((current) => current.filter((item) => item.product_id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove product from wishlist.");
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Customer</span>
        <h1>My wishlist</h1>
        <p>Products you saved for later.</p>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading wishlist...</p>}
        {!loading && !error && items.length === 0 && (
          <div>
            <p>Your wishlist is empty.</p>
            <Link className="button-link" to="/products">Browse products</Link>
          </div>
        )}

        <div className="product-market-grid">
          {items.map((item) => {
            const image = primaryImage(item);
            const url = image ? imageUrl(image.storage_path) : null;
            const product = item.product;
            return (
              <article className="product-market-card" key={item.id}>
                {url ? <img src={url} alt={image?.alt_text ?? product.name} /> : <div className="product-market-card__empty">No image</div>}
                <div className="product-market-card__body">
                  <span className="eyebrow">{product.category?.name ?? "Product"}</span>
                  <h2>{product.name}</h2>
                  <p className="product-price">GH₵{product.price.toFixed(2)}</p>
                  <p>Sold by <Link to={`/businesses/${product.business.slug}`}>{product.business.name}</Link></p>
                  <p>{product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}</p>
                  <div className="actions">
                    <Link className="button-link" to={`/products/${product.id}/${product.slug}`}>View product</Link>
                    <button type="button" className="secondary-button" disabled={busyProductId === product.id} onClick={() => void remove(product.id)}>
                      {busyProductId === product.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/products">Browse products</Link>
          <Link className="button-link button-link--secondary" to="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
