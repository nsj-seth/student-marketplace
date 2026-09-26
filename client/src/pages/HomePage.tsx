import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { logout } from "../services/auth.service";
import { getMarketplaceHome, type MarketplaceHomeData } from "../services/marketplace.service";
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

export function HomePage() {
  const { user, roles, loading: authLoading } = useAuth();
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

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    const params = term ? `?search=${encodeURIComponent(term)}` : "";
    navigate(`/${searchType}${params}`);
  }

  return (
    <main className="market-home">
      <header className="market-nav">
        <Link className="market-brand" to="/">Student Marketplace</Link>
        <nav>
          <Link to="/products">Products</Link>
          <Link to="/businesses">Businesses</Link>
          {!authLoading && !user && <Link to="/login">Login</Link>}
          {!authLoading && !user && <Link className="button-link" to="/register">Register</Link>}
          {!authLoading && user && <Link to="/profile">My profile</Link>}
          {!authLoading && user && <Link to="/wishlist">Wishlist</Link>}
          {!authLoading && user && <Link to="/cart">Cart</Link>}
          {!authLoading && user && <Link to="/sell">Sell</Link>}
          {!authLoading && roles.includes("SELLER") && <Link to="/seller/businesses">My businesses</Link>}
          {!authLoading && roles.includes("ADMIN") && <Link to="/admin/seller-applications">Admin</Link>}
          {!authLoading && user && <button className="nav-button" onClick={() => void logout()}>Logout</button>}
        </nav>
      </header>

      <section className="market-hero">
        <span className="eyebrow">Discover student and community businesses</span>
        <h1>Find products and businesses around your community.</h1>
        <p>Browse approved student businesses and other local sellers from one marketplace.</p>
        <form className="hero-search" onSubmit={submitSearch}>
          <select value={searchType} onChange={(event) => setSearchType(event.target.value as "products" | "businesses")}>
            <option value="products">Products</option>
            <option value="businesses">Businesses</option>
          </select>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchType === "products" ? "Search products..." : "Search businesses..."} />
          <button type="submit">Search</button>
        </form>
      </section>

      {error && <p className="message message--error home-message">{error}</p>}
      {loading && <p className="home-message">Loading marketplace...</p>}

      {data && (
        <>
          <section className="home-section">
            <div className="section-heading"><div><span className="eyebrow">Explore</span><h2>Categories</h2></div><Link to="/products">View all products</Link></div>
            <div className="category-strip">
              {data.categories.map((category) => <Link key={category.id} to={`/products?category=${encodeURIComponent(category.id)}`}>{category.name}</Link>)}
            </div>
          </section>

          {data.featuredBusinesses.length > 0 && (
            <section className="home-section">
              <div className="section-heading"><div><span className="eyebrow">Selected by the marketplace</span><h2>Featured businesses</h2></div><Link to="/businesses">See businesses</Link></div>
              <div className="home-business-grid">
                {data.featuredBusinesses.map((business) => {
                  const logo = businessLogo(business.logo_path);
                  return <article className="home-business-card" key={business.id}>{logo ? <img src={logo} alt="" /> : <div className="home-image-empty">No logo</div>}<div><span className="eyebrow">{business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Business"}</span><h3>{business.name}</h3><p>{business.location_text}</p><Link to={`/businesses/${business.slug}`}>View storefront</Link></div></article>;
                })}
              </div>
            </section>
          )}

          {data.featuredProducts.length > 0 && (
            <section className="home-section">
              <div className="section-heading"><div><span className="eyebrow">Marketplace picks</span><h2>Featured products</h2></div><Link to="/products">See products</Link></div>
              <div className="home-product-grid">
                {data.featuredProducts.map((product) => {
                  const image = productImage(product);
                  return <article className="home-product-card" key={product.id}>{image ? <img src={image} alt={product.name} /> : <div className="home-image-empty">No image</div>}<div><span className="eyebrow">{product.category?.name ?? "Product"}</span><h3>{product.name}</h3><strong>{money(product.price)}</strong><p>{product.business.name}</p><Link to={`/products/${product.id}/${product.slug}`}>View product</Link></div></article>;
                })}
              </div>
            </section>
          )}

          <section className="home-section">
            <div className="section-heading"><div><span className="eyebrow">Recently added</span><h2>New products</h2></div><Link to="/products">Browse all</Link></div>
            <div className="home-product-grid">
              {data.newProducts.map((product) => {
                const image = productImage(product);
                return <article className="home-product-card" key={product.id}>{image ? <img src={image} alt={product.name} /> : <div className="home-image-empty">No image</div>}<div><span className="eyebrow">{product.category?.name ?? "Product"}</span><h3>{product.name}</h3><strong>{money(product.price)}</strong><p>{product.business.name}</p><Link to={`/products/${product.id}/${product.slug}`}>View product</Link></div></article>;
              })}
            </div>
          </section>

          <section className="home-section">
            <div className="section-heading"><div><span className="eyebrow">Recently approved</span><h2>New businesses</h2></div><Link to="/businesses">Browse all</Link></div>
            <div className="home-business-grid">
              {data.newBusinesses.map((business) => {
                const logo = businessLogo(business.logo_path);
                return <article className="home-business-card" key={business.id}>{logo ? <img src={logo} alt="" /> : <div className="home-image-empty">No logo</div>}<div><span className="eyebrow">{business.business_type === "STUDENT_BUSINESS" ? "Student business" : "Business"}</span><h3>{business.name}</h3><p>{business.university?.short_name || business.location_text}</p><Link to={`/businesses/${business.slug}`}>View storefront</Link></div></article>;
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
