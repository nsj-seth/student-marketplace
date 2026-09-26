import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { getPublicProduct, type PublicProduct } from "../../services/product.service";
import { addToWishlist, getWishlistStatus, removeFromWishlist } from "../../services/wishlist.service";
import { addToCart } from "../../services/cart.service";
import { PublicReviewsPanel } from "../../components/reviews/PublicReviewsPanel";

function imageUrl(path: string) {
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) return;
      try {
        const response = await getPublicProduct(id);
        const loaded = response.data ?? null;
        if (!active) return;
        setProduct(loaded);
        const primary = loaded?.images.find((image) => image.is_primary) ?? loaded?.images[0] ?? null;
        setSelectedImageId(primary?.id ?? null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load product.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!id || !user) {
      setWishlisted(false);
      return;
    }

    let active = true;
    void getWishlistStatus(id)
      .then((response) => {
        if (active) setWishlisted(Boolean(response.data?.wishlisted));
      })
      .catch(() => {
        if (active) setWishlisted(false);
      });

    return () => { active = false; };
  }, [id, user]);

  async function toggleWishlist() {
    if (!id || !user) return;
    setWishlistLoading(true);
    setWishlistError("");
    try {
      if (wishlisted) {
        await removeFromWishlist(id);
        setWishlisted(false);
      } else {
        await addToWishlist(id);
        setWishlisted(true);
      }
    } catch (err) {
      setWishlistError(err instanceof Error ? err.message : "Unable to update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  }


  async function handleAddToCart() {
    if (!id || !user) return;
    setCartLoading(true);
    setCartMessage("");
    setCartError("");
    try {
      const response = await addToCart(id, 1);
      const quantity = response.data?.total_quantity ?? 1;
      setCartMessage(`Added to cart. Cart now has ${quantity} item(s).`);
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "Unable to add to cart.");
    } finally {
      setCartLoading(false);
    }
  }

  const selectedImage = useMemo(
    () => product?.images.find((image) => image.id === selectedImageId) ?? product?.images[0] ?? null,
    [product, selectedImageId]
  );

  if (loading) return <main className="wide-shell"><section className="card wide-card"><p>Loading product...</p></section></main>;
  if (error || !product) return <main className="wide-shell"><section className="card wide-card"><h1>Product unavailable</h1><p className="message message--error">{error || "Product not found."}</p><Link to="/products">Back to products</Link></section></main>;

  const unavailable = product.status === "OUT_OF_STOCK" || product.business.availability_status === "UNAVAILABLE";

  return (
    <main className="wide-shell">
      <section className="card wide-card product-detail-layout">
        <div>
          {selectedImage ? <img className="product-detail-main-image" src={imageUrl(selectedImage.storage_path)} alt={selectedImage.alt_text ?? product.name} /> : <div className="product-detail-main-image product-detail-empty">No product image</div>}
          {product.images.length > 1 && (
            <div className="product-detail-thumbnails">
              {product.images.map((image) => (
                <button type="button" key={image.id} className={image.id === selectedImage?.id ? "product-thumb product-thumb--active" : "product-thumb"} onClick={() => setSelectedImageId(image.id)}>
                  <img src={imageUrl(image.storage_path)} alt={image.alt_text ?? product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="eyebrow">{product.category?.name ?? "Product"}</span>
          <h1>{product.name}</h1>
          <p className="product-price product-price--large">GH₵{product.price.toFixed(2)}</p>
          <p>{product.description || "No description provided."}</p>
          <p><strong>Available quantity:</strong> {product.stock_quantity}</p>
          <p><strong>Stock:</strong> {product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}</p>
          <p><strong>Business availability:</strong> {product.business.availability_status === "OPEN" ? "Currently Open" : "Currently Unavailable"}</p>

          <section className="info-box">
            <h2>Sold by {product.business.name}</h2>
            <p>{product.business.university?.name || product.business.location_text}</p>
            <p>{product.business.pickup_enabled && "Pickup"}{product.business.pickup_enabled && product.business.seller_delivery_enabled && " • "}{product.business.seller_delivery_enabled && "Seller Delivery"}</p>
            <Link to={`/businesses/${product.business.slug}`}>View storefront</Link>
          </section>

          {wishlistError && <p className="message message--error">{wishlistError}</p>}
          {cartError && <p className="message message--error">{cartError}</p>}
          {cartMessage && <p className="message message--success">{cartMessage} <Link to="/cart">View cart</Link></p>}
          <div className="actions">
            {user ? (
              <button type="button" disabled={unavailable || cartLoading} onClick={() => void handleAddToCart()}>{unavailable ? "Currently unavailable" : cartLoading ? "Adding..." : "Add to cart"}</button>
            ) : (
              <Link className="button-link" to="/login">Login to add to cart</Link>
            )}
            {user ? (
              <button type="button" className="secondary-button" disabled={wishlistLoading} onClick={() => void toggleWishlist()}>
                {wishlistLoading ? "Saving..." : wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              </button>
            ) : (
              <Link className="button-link button-link--secondary" to="/login">Login to save</Link>
            )}
            <Link className="button-link button-link--secondary" to="/products">Back to products</Link>
          </div>
          {user && <p className="account-line"><Link to="/wishlist">View my wishlist</Link> • <Link to="/cart">View my cart</Link></p>}
        </div>
      </section>
      <section className="card wide-card">
        <PublicReviewsPanel targetType="PRODUCT" targetId={product.id} />
      </section>
    </main>
  );
}
