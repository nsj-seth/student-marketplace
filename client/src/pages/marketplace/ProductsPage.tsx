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

function primaryImage(product: PublicProduct) {
  return product.images.find((image) => image.is_primary) ?? product.images[0] ?? null;
}

function money(value: number) {
  return `GH₵${value.toFixed(2)}`;
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

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
    return {
      search: search.trim() || undefined,
      category: category || undefined,
      university: university || undefined,
      businessType: (businessType || undefined) as PublicProductFilters["businessType"],
      availability: (availability || undefined) as PublicProductFilters["availability"],
      stock: (stock || undefined) as PublicProductFilters["stock"],
      fulfilment: (fulfilment || undefined) as PublicProductFilters["fulfilment"],
      minPrice: numberOrUndefined(minPrice),
      maxPrice: numberOrUndefined(maxPrice),
      sort: (sort || undefined) as PublicProductFilters["sort"]
    };
  }

  async function load(filters: PublicProductFilters) {
    setLoading(true);
    setError("");
    try {
      const response = await getPublicProducts(filters);
      setProducts(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial: PublicProductFilters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      university: searchParams.get("university") || undefined,
      businessType: (searchParams.get("businessType") || undefined) as PublicProductFilters["businessType"],
      availability: (searchParams.get("availability") || undefined) as PublicProductFilters["availability"],
      stock: (searchParams.get("stock") || undefined) as PublicProductFilters["stock"],
      fulfilment: (searchParams.get("fulfilment") || undefined) as PublicProductFilters["fulfilment"],
      minPrice: numberOrUndefined(searchParams.get("minPrice") ?? ""),
      maxPrice: numberOrUndefined(searchParams.get("maxPrice") ?? ""),
      sort: (searchParams.get("sort") || "NEWEST") as PublicProductFilters["sort"]
    };
    void load(initial);
    void Promise.all([getCategories(), getUniversities()])
      .then(([categoryResponse, universityResponse]) => {
        setCategories(categoryResponse.data ?? []);
        setUniversities(universityResponse.data ?? []);
      })
      .catch(() => undefined);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const filters = currentFilters();
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") next.set(key, String(value));
    });
    setSearchParams(next);
    void load(filters);
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setUniversity("");
    setBusinessType("");
    setAvailability("");
    setStock("");
    setFulfilment("");
    setMinPrice("");
    setMaxPrice("");
    setSort("NEWEST");
    setSearchParams(new URLSearchParams());
    void load({ sort: "NEWEST" });
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Marketplace</span>
        <h1>Products</h1>
        <p>Search and filter products using marketplace data from the server.</p>

        <form className="marketplace-filter marketplace-filter--expanded" onSubmit={submit}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <select value={university} onChange={(event) => setUniversity(event.target.value)}>
            <option value="">All universities</option>
            {universities.map((item) => <option value={item.id} key={item.id}>{item.short_name || item.name}</option>)}
          </select>
          <select value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
            <option value="">All business types</option>
            <option value="STUDENT_BUSINESS">Student businesses</option>
            <option value="OTHER_BUSINESS">Other businesses</option>
          </select>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <option value="">Any business availability</option>
            <option value="OPEN">Business open</option>
            <option value="UNAVAILABLE">Business unavailable</option>
          </select>
          <select value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="">Any stock status</option>
            <option value="IN_STOCK">In stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
          <select value={fulfilment} onChange={(event) => setFulfilment(event.target.value)}>
            <option value="">Any fulfilment</option>
            <option value="PICKUP">Pickup</option>
            <option value="SELLER_DELIVERY">Seller delivery</option>
          </select>
          <input type="number" min="0" step="0.01" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" />
          <input type="number" min="0" step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price" />
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="NEWEST">Newest first</option>
            <option value="PRICE_LOW_TO_HIGH">Price: low to high</option>
            <option value="PRICE_HIGH_TO_LOW">Price: high to low</option>
            <option value="NAME_A_TO_Z">Name: A–Z</option>
          </select>
          <div className="actions">
            <button type="submit">Apply filters</button>
            <button type="button" className="secondary-button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading products...</p>}
        {!loading && !error && <p><strong>{products.length}</strong> product{products.length === 1 ? "" : "s"} found.</p>}
        {!loading && !error && products.length === 0 && <p>No products matched your filters.</p>}

        <div className="product-market-grid">
          {products.map((product) => {
            const image = primaryImage(product);
            const url = image ? imageUrl(image.storage_path) : null;
            return (
              <article className="product-market-card" key={product.id}>
                {url ? <img src={url} alt={image?.alt_text ?? product.name} /> : <div className="product-market-card__empty">No image</div>}
                <div className="product-market-card__body">
                  <span className="eyebrow">{product.category?.name ?? "Product"}</span>
                  <h2>{product.name}</h2>
                  <p className="product-price">{money(product.price)}</p>
                  {product.review_count > 0 && <p><strong>★ {product.rating?.toFixed(1)}</strong> ({product.review_count} review{product.review_count === 1 ? "" : "s"})</p>}
                  <p>Sold by <Link to={`/businesses/${product.business.slug}`}>{product.business.name}</Link></p>
                  <p>{product.business.university?.short_name || product.business.location_text}</p>
                  <p>{product.business.pickup_enabled ? "Pickup" : ""}{product.business.pickup_enabled && product.business.seller_delivery_enabled ? " · " : ""}{product.business.seller_delivery_enabled ? "Seller delivery" : ""}</p>
                  <span className={`availability-badge ${product.status === "OUT_OF_STOCK" ? "availability-badge--unavailable" : "availability-badge--open"}`}>
                    {product.status === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}
                  </span>
                  <div className="actions"><Link className="button-link" to={`/products/${product.id}/${product.slug}`}>View product</Link></div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/businesses">Browse businesses</Link>
          <Link className="button-link button-link--secondary" to="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
