import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCategories, type Category } from "../../services/category.service";
import { getPublicProducts, type PublicProduct, type PublicProductFilters } from "../../services/product.service";
import { getUniversities, type University } from "../../services/university.service";

function imageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
function primaryImage(product: PublicProduct) { return product.images.find((image) => image.is_primary) ?? product.images[0] ?? null; }
function money(value: number) { return `GH₵${value.toFixed(2)}`; }
function numberOrUndefined(value: string) { if (!value.trim()) return undefined; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; }

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [university, setUniversity] = useState(() => searchParams.get("university") ?? "");
  const [businessType, setBusinessType] = useState(() => searchParams.get("businessType") ?? "");
  const [availability, setAvailability] = useState(() => searchParams.get("availability") ?? "");
  const [stock, setStock] = useState(() => searchParams.get("stock") ?? "");
  const [fulfilment, setFulfilment] = useState(() => searchParams.get("fulfilment") ?? "");
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "NEWEST");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function currentFilters(): PublicProductFilters {
    return { search: search.trim() || undefined, category: category || undefined, university: university || undefined,
      businessType: (businessType || undefined) as PublicProductFilters["businessType"], availability: (availability || undefined) as PublicProductFilters["availability"],
      stock: (stock || undefined) as PublicProductFilters["stock"], fulfilment: (fulfilment || undefined) as PublicProductFilters["fulfilment"],
      minPrice: numberOrUndefined(minPrice), maxPrice: numberOrUndefined(maxPrice), sort: (sort || undefined) as PublicProductFilters["sort"] };
  }
  async function load(filters: PublicProductFilters) { setLoading(true); setError(""); try { const response = await getPublicProducts(filters); setProducts(response.data ?? []); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load products."); } finally { setLoading(false); } }

  useEffect(() => {
    const initial: PublicProductFilters = { search: searchParams.get("search") || undefined, category: searchParams.get("category") || undefined, university: searchParams.get("university") || undefined,
      businessType: (searchParams.get("businessType") || undefined) as PublicProductFilters["businessType"], availability: (searchParams.get("availability") || undefined) as PublicProductFilters["availability"],
      stock: (searchParams.get("stock") || undefined) as PublicProductFilters["stock"], fulfilment: (searchParams.get("fulfilment") || undefined) as PublicProductFilters["fulfilment"],
      minPrice: numberOrUndefined(searchParams.get("minPrice") ?? ""), maxPrice: numberOrUndefined(searchParams.get("maxPrice") ?? ""), sort: (searchParams.get("sort") || "NEWEST") as PublicProductFilters["sort"] };
    void load(initial);
    void Promise.all([getCategories(), getUniversities()]).then(([c,u]) => { setCategories(c.data ?? []); setUniversities(u.data ?? []); }).catch(() => undefined);
  }, []);

  function submit(event: FormEvent) { event.preventDefault(); const filters = currentFilters(); const next = new URLSearchParams(); Object.entries(filters).forEach(([key,value]) => { if (value !== undefined && value !== "") next.set(key, String(value)); }); setSearchParams(next); void load(filters); }
  function clearFilters() { setSearch(""); setCategory(""); setUniversity(""); setBusinessType(""); setAvailability(""); setStock(""); setFulfilment(""); setMinPrice(""); setMaxPrice(""); setSort("NEWEST"); setSearchParams(new URLSearchParams()); void load({ sort: "NEWEST" }); }

  return <main className="wide-shell marketplace-page">
    <section className="marketplace-page-hero">
      <div><span className="eyebrow">Discover the marketplace</span><h1>Find something you’ll love</h1><p>Browse products from student and community businesses, compare options and shop locally.</p></div>
      <Link className="button-link button-link--secondary" to="/businesses">Explore stores</Link>
    </section>

    <div className="marketplace-catalog-layout">
      <aside className="catalog-filter-card">
        <div className="catalog-filter-heading"><div><span className="eyebrow">Refine</span><h2>Filters</h2></div><button type="button" className="text-button" onClick={clearFilters}>Reset</button></div>
        <form className="catalog-filter-form" onSubmit={submit}>
          <label>Search<input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="What are you looking for?" /></label>
          <label>Category<select value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(i=><option value={i.id} key={i.id}>{i.name}</option>)}</select></label>
          <label>University<select value={university} onChange={(e)=>setUniversity(e.target.value)}><option value="">All universities</option>{universities.map(i=><option value={i.id} key={i.id}>{i.short_name || i.name}</option>)}</select></label>
          <label>Seller type<select value={businessType} onChange={(e)=>setBusinessType(e.target.value)}><option value="">All businesses</option><option value="STUDENT_BUSINESS">Student businesses</option><option value="OTHER_BUSINESS">Other businesses</option></select></label>
          <label>Availability<select value={availability} onChange={(e)=>setAvailability(e.target.value)}><option value="">Any availability</option><option value="OPEN">Open now</option><option value="UNAVAILABLE">Unavailable</option></select></label>
          <label>Stock<select value={stock} onChange={(e)=>setStock(e.target.value)}><option value="">Any stock status</option><option value="IN_STOCK">In stock</option><option value="OUT_OF_STOCK">Out of stock</option></select></label>
          <label>Fulfilment<select value={fulfilment} onChange={(e)=>setFulfilment(e.target.value)}><option value="">Any fulfilment</option><option value="PICKUP">Pickup</option><option value="SELLER_DELIVERY">Seller delivery</option></select></label>
          <div className="price-filter-row"><label>Min<input type="number" min="0" step="0.01" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder="GH₵0" /></label><label>Max<input type="number" min="0" step="0.01" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder="Any" /></label></div>
          <button type="submit">Apply filters</button>
        </form>
      </aside>

      <section className="catalog-results">
        <div className="catalog-results-toolbar">
          <div><span className="eyebrow">Products</span><h2>{loading ? "Loading marketplace…" : `${products.length} ${products.length === 1 ? "product" : "products"}`}</h2></div>
          <label className="sort-control">Sort<select value={sort} onChange={(e)=>{ setSort(e.target.value); const filters={...currentFilters(), sort:e.target.value as PublicProductFilters["sort"]}; void load(filters); }}><option value="NEWEST">Newest</option><option value="PRICE_LOW_TO_HIGH">Price: low to high</option><option value="PRICE_HIGH_TO_LOW">Price: high to low</option><option value="NAME_A_TO_Z">Name: A–Z</option></select></label>
        </div>
        {error && <p className="message message--error">{error}</p>}
        {!loading && !error && products.length===0 && <div className="catalog-empty"><div className="catalog-empty-icon">⌕</div><h3>No products found</h3><p>Try clearing a few filters or searching for something else.</p><button onClick={clearFilters}>Clear filters</button></div>}
        <div className="product-market-grid product-market-grid--catalog">
          {products.map(product=>{ const image=primaryImage(product); const url=image?imageUrl(image.storage_path):null; return <article className="product-market-card catalog-product-card" key={product.id}>
            <Link className="catalog-product-image" to={`/products/${product.id}/${product.slug}`}>{url?<img src={url} alt={image?.alt_text ?? product.name}/>:<div className="product-market-card__empty">No image</div>}<span className={`catalog-stock-pill ${product.status === "OUT_OF_STOCK" ? "catalog-stock-pill--muted" : ""}`}>{product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}</span></Link>
            <div className="product-market-card__body"><span className="eyebrow">{product.category?.name ?? "Product"}</span><h2><Link to={`/products/${product.id}/${product.slug}`}>{product.name}</Link></h2><p className="product-price">{money(product.price)}</p>
            <div className="catalog-rating">{product.review_count>0?<><strong>★ {product.rating?.toFixed(1)}</strong><span>({product.review_count})</span></>:<span>New listing</span>}</div>
            <div className="catalog-seller-line"><span>Sold by</span><Link to={`/businesses/${product.business.slug}`}>{product.business.name}</Link></div>
            <div className="catalog-card-meta"><span>{product.business.university?.short_name || product.business.location_text}</span><span>{product.business.pickup_enabled?"Pickup":""}{product.business.pickup_enabled&&product.business.seller_delivery_enabled?" · ":""}{product.business.seller_delivery_enabled?"Delivery":""}</span></div></div>
          </article>;})}
        </div>
      </section>
    </div>
  </main>;
}
