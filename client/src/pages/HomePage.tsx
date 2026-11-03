import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMarketplaceHome, type MarketplaceHomeData } from "../services/marketplace.service";
import type { PublicBusiness } from "../services/business.service";
import type { PublicProduct } from "../services/product.service";

function productImage(product: PublicProduct) {
  const image = product.images.find((item) => item.is_primary) ?? product.images[0];
  return image ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : null;
}

function businessLogo(path: string | null) {
  return path ? supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl : null;
}

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

function categoryIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("food") || key.includes("bak")) return "🍜";
  if (key.includes("fashion") || key.includes("cloth")) return "👕";
  if (key.includes("elect") || key.includes("tech")) return "💻";
  if (key.includes("beauty") || key.includes("care")) return "✨";
  if (key.includes("book") || key.includes("station")) return "📚";
  if (key.includes("access")) return "🎒";
  if (key.includes("service")) return "🛠️";
  return "🛍️";
}

function ProductCard({ product, featured = false }: { product: PublicProduct; featured?: boolean }) {
  const image = productImage(product);
  return (
    <article className={`discover-product-card${featured ? " discover-product-card--featured" : ""}`}>
      <Link className="discover-product-card__media" to={`/products/${product.id}/${product.slug}`}>
        {image ? <img src={image} alt={product.name} /> : <div className="discover-image-placeholder">Product</div>}
        {featured && <span className="discover-floating-badge">Featured</span>}
        {product.status === "OUT_OF_STOCK" && <span className="discover-stock-badge">Out of stock</span>}
      </Link>
      <div className="discover-product-card__body">
        <div className="discover-product-card__meta">
          <span>{product.category?.name ?? "Product"}</span>
          {product.review_count > 0 && <span>★ {product.rating?.toFixed(1)}</span>}
        </div>
        <Link className="discover-product-card__title" to={`/products/${product.id}/${product.slug}`}>{product.name}</Link>
        <Link className="discover-product-card__seller" to={`/businesses/${product.business.slug}`}>{product.business.name}</Link>
        <div className="discover-product-card__footer">
          <strong>{money(product.price)}</strong>
          <Link className="discover-icon-button" to={`/products/${product.id}/${product.slug}`} aria-label={`View ${product.name}`}>→</Link>
        </div>
      </div>
    </article>
  );
}

function BusinessCard({ business, featured = false }: { business: PublicBusiness; featured?: boolean }) {
  const logo = businessLogo(business.logo_path);
  return (
    <article className={`discover-business-card${featured ? " discover-business-card--featured" : ""}`}>
      <div className="discover-business-card__cover">
        <span className="discover-business-card__type">{business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Community business"}</span>
        {featured && <span className="discover-business-card__featured">★ Featured</span>}
      </div>
      <div className="discover-business-card__body">
        <div className="discover-business-logo">
          {logo ? <img src={logo} alt={`${business.name} logo`} /> : <span>{business.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="discover-business-card__heading">
          <div>
            <Link to={`/businesses/${business.slug}`}>{business.name}</Link>
            <p>{business.university?.short_name || business.location_text}</p>
          </div>
          <span className={`discover-open-state ${business.availability_status === "OPEN" ? "is-open" : ""}`}>
            {business.availability_status === "OPEN" ? "Open" : "Unavailable"}
          </span>
        </div>
        <p className="discover-business-card__description">{business.description}</p>
        <div className="discover-business-card__footer">
          <span>{business.review_count > 0 ? `★ ${business.rating?.toFixed(1)} · ${business.review_count} reviews` : "New on marketplace"}</span>
          <Link to={`/businesses/${business.slug}`}>Visit store →</Link>
        </div>
      </div>
    </article>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketplaceHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"products" | "businesses">("products");

  useEffect(() => {
    getMarketplaceHome()
      .then((response) => setData(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load marketplace."))
      .finally(() => setLoading(false));
  }, []);

  const showcaseProducts = useMemo(() => {
    if (!data) return [];
    return (data.featuredProducts.length ? data.featuredProducts : data.newProducts).slice(0, 4);
  }, [data]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    const params = term ? `?search=${encodeURIComponent(term)}` : "";
    navigate(`/${searchType}${params}`);
  }

  return (
    <main className="discover-home">
      <section className="discover-hero">
        <div className="discover-hero__content">
          <span className="discover-pill">Student & community marketplace</span>
          <h1>Shop local. <span>Discover more.</span></h1>
          <p>Find products, services and trusted businesses from students and communities around you.</p>

          <form className="discover-search" onSubmit={submitSearch}>
            <div className="discover-search__type">
              <button type="button" className={searchType === "products" ? "is-active" : ""} onClick={() => setSearchType("products")}>Products</button>
              <button type="button" className={searchType === "businesses" ? "is-active" : ""} onClick={() => setSearchType("businesses")}>Businesses</button>
            </div>
            <div className="discover-search__input">
              <span aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchType === "products" ? "What are you looking for?" : "Find a business..."}
              />
              <button type="submit">Search</button>
            </div>
          </form>

          <div className="discover-hero__actions">
            <Link className="button button--primary" to="/products">Explore products</Link>
            <Link className="button button--soft" to="/businesses">Browse businesses</Link>
          </div>

          <div className="discover-hero__trust">
            <span><strong>✓</strong> Verified sellers</span>
            <span><strong>✓</strong> Local discovery</span>
            <span><strong>✓</strong> Customer reviews</span>
          </div>
        </div>

        <div className="discover-hero__visual" aria-label="Marketplace preview">
          <div className="discover-hero__glow discover-hero__glow--one" />
          <div className="discover-hero__glow discover-hero__glow--two" />
          <div className="discover-preview-card discover-preview-card--top">
            <span className="discover-preview-card__label">Trending now</span>
            <strong>{showcaseProducts[0]?.name ?? "Fresh marketplace finds"}</strong>
            <small>{showcaseProducts[0] ? money(showcaseProducts[0].price) : "Discover something new"}</small>
          </div>
          <div className="discover-preview-stack">
            {showcaseProducts.slice(0, 3).map((product, index) => {
              const image = productImage(product);
              return (
                <Link key={product.id} to={`/products/${product.id}/${product.slug}`} className={`discover-preview-product discover-preview-product--${index + 1}`}>
                  {image ? <img src={image} alt="" /> : <div className="discover-preview-product__placeholder">{product.name.slice(0, 1)}</div>}
                  <div><small>{product.category?.name ?? "Product"}</small><strong>{product.name}</strong></div>
                </Link>
              );
            })}
          </div>
          <div className="discover-preview-stat"><strong>Local first</strong><span>Support businesses around you</span></div>
        </div>
      </section>

      {error && <p className="message message--error discover-status">{error}</p>}
      {loading && <div className="discover-loading"><div className="discover-loading__bar" /><p>Loading your marketplace…</p></div>}

      {data && (
        <>
          <section className="discover-section discover-section--categories">
            <div className="discover-section__heading">
              <div><span className="discover-kicker">Explore by category</span><h2>Find what you need, faster.</h2></div>
              <Link to="/products">View all products →</Link>
            </div>
            <div className="discover-category-grid">
              {data.categories.slice(0, 8).map((category) => (
                <Link className="discover-category-card" key={category.id} to={`/products?category=${encodeURIComponent(category.id)}`}>
                  <span className="discover-category-card__icon">{categoryIcon(category.name)}</span>
                  <span>{category.name}</span>
                  <small>Explore →</small>
                </Link>
              ))}
            </div>
          </section>

          {data.featuredProducts.length > 0 && (
            <section className="discover-section">
              <div className="discover-section__heading">
                <div><span className="discover-kicker">Handpicked for you</span><h2>Featured products</h2><p>Popular finds selected for the marketplace.</p></div>
                <Link to="/products">Shop all →</Link>
              </div>
              <div className="discover-product-grid">
                {data.featuredProducts.slice(0, 8).map((product) => <ProductCard product={product} featured key={product.id} />)}
              </div>
            </section>
          )}

          <section className="discover-promo-band">
            <div>
              <span className="discover-kicker discover-kicker--light">Built for local sellers</span>
              <h2>Have something to sell?</h2>
              <p>Start your business profile, reach new customers and manage your products in one place.</p>
            </div>
            <Link className="button discover-promo-band__button" to="/sell">Start selling</Link>
          </section>

          {data.featuredBusinesses.length > 0 && (
            <section className="discover-section">
              <div className="discover-section__heading">
                <div><span className="discover-kicker">Businesses to know</span><h2>Featured stores</h2><p>Discover verified sellers building something worth supporting.</p></div>
                <Link to="/businesses">See all businesses →</Link>
              </div>
              <div className="discover-business-grid">
                {data.featuredBusinesses.slice(0, 6).map((business) => <BusinessCard business={business} featured key={business.id} />)}
              </div>
            </section>
          )}

          <section className="discover-section">
            <div className="discover-section__heading">
              <div><span className="discover-kicker">Just added</span><h2>New marketplace finds</h2><p>Fresh products from sellers across the community.</p></div>
              <Link to="/products?sort=NEWEST">Browse newest →</Link>
            </div>
            {data.newProducts.length > 0 ? (
              <div className="discover-product-grid">
                {data.newProducts.slice(0, 8).map((product) => <ProductCard product={product} key={product.id} />)}
              </div>
            ) : <div className="empty-state">No products have been added yet.</div>}
          </section>

          <section className="discover-section discover-section--businesses">
            <div className="discover-section__heading">
              <div><span className="discover-kicker">Meet new sellers</span><h2>Recently joined businesses</h2></div>
              <Link to="/businesses?sort=NEWEST">Explore directory →</Link>
            </div>
            {data.newBusinesses.length > 0 ? (
              <div className="discover-business-grid discover-business-grid--compact">
                {data.newBusinesses.slice(0, 6).map((business) => <BusinessCard business={business} key={business.id} />)}
              </div>
            ) : <div className="empty-state">No businesses have joined yet.</div>}
          </section>

          <section className="discover-value-strip">
            <article><span>01</span><div><strong>Discover locally</strong><p>Find sellers connected to campuses and communities.</p></div></article>
            <article><span>02</span><div><strong>Shop confidently</strong><p>See availability, ratings and verified-purchase reviews.</p></div></article>
            <article><span>03</span><div><strong>Track every order</strong><p>Follow each seller's fulfilment progress from one account.</p></div></article>
          </section>
        </>
      )}
    </main>
  );
}
