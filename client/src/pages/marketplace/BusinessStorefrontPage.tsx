import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getPublicBusiness, type PublicBusiness } from "../../services/business.service";
import { getPublicProducts, type PublicProduct } from "../../services/product.service";

function getLogoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

function getProductImageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function BusinessStorefrontPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug) return;
      try {
        const response = await getPublicBusiness(slug);
        const loadedBusiness = response.data ?? null;
        if (active) setBusiness(loadedBusiness);
        if (loadedBusiness) {
          const productResponse = await getPublicProducts({ business: loadedBusiness.id });
          if (active) setProducts(productResponse.data ?? []);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load storefront.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <main className="page-shell"><section className="card"><p>Loading storefront...</p></section></main>;

  if (error || !business) {
    return (
      <main className="page-shell">
        <section className="card">
          <h1>Storefront unavailable</h1>
          <p className="message message--error">{error || "Business not found."}</p>
          <Link to="/businesses">Back to businesses</Link>
        </section>
      </main>
    );
  }

  const logoUrl = getLogoUrl(business.logo_path);
  const socialEntries = Object.entries(business.social_links).filter(([, value]) => Boolean(value));

  return (
    <main className="wide-shell">
      <section className="card wide-card storefront">
        <div className="storefront-header">
          {logoUrl ? <img className="storefront-logo storefront-logo--large" src={logoUrl} alt={`${business.name} logo`} /> : <div className="storefront-logo storefront-logo--large storefront-logo--empty">No logo</div>}
          <div>
            <span className="eyebrow">{business.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}</span>
            <h1>{business.name}</h1>
            <span className={`availability-badge availability-badge--${business.availability_status.toLowerCase()}`}>
              {business.availability_status === "OPEN" ? "Currently Open" : "Currently Unavailable"}
            </span>
          </div>
        </div>

        <p>{business.description}</p>

        <div className="storefront-info-grid">
          <section>
            <h2>Business information</h2>
            {business.university && <p><strong>University:</strong> {business.university.name}</p>}
            <p><strong>Location:</strong> {business.location_text}</p>
            <p><strong>Contact:</strong> {business.contact_phone}</p>
            <p><strong>Categories:</strong> {business.categories.map((category) => category.name).join(", ") || "None"}</p>
          </section>

          <section>
            <h2>Fulfilment</h2>
            <ul>
              {business.pickup_enabled && <li>Customer pickup</li>}
              {business.seller_delivery_enabled && <li>Seller delivery</li>}
            </ul>
            {socialEntries.length > 0 && (
              <>
                <h2>Contact links</h2>
                <ul>
                  {socialEntries.map(([label, value]) => <li key={label}><strong>{label}:</strong> {value}</li>)}
                </ul>
              </>
            )}
          </section>
        </div>

        <section className="storefront-placeholder">
          <h2>Products</h2>
          {products.length === 0 ? <p>No public products are available from this business yet.</p> : (
            <div className="product-market-grid">
              {products.map((product) => {
                const image = product.images.find((item) => item.is_primary) ?? product.images[0] ?? null;
                const productImageUrl = getProductImageUrl(image?.storage_path ?? null);
                return (
                  <article className="product-market-card" key={product.id}>
                    {productImageUrl ? <img src={productImageUrl} alt={image?.alt_text ?? product.name} /> : <div className="product-market-card__empty">No image</div>}
                    <div className="product-market-card__body">
                      <h3>{product.name}</h3>
                      <p className="product-price">GH₵{product.price.toFixed(2)}</p>
                      <p>{product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}</p>
                      <Link className="button-link" to={`/products/${product.id}/${product.slug}`}>View product</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="storefront-placeholder">
          <h2>Reviews & rating</h2>
          <p>Verified reviews and ratings will appear here after the Reviews phase.</p>
        </section>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/businesses">Browse businesses</Link>
          <Link className="button-link button-link--secondary" to="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
