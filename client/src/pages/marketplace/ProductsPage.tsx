import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCategories, type Category } from "../../services/category.service";
import { getPublicProducts, type PublicProduct } from "../../services/product.service";

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

export function ProductsPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(filters: { search?: string; category?: string; stock?: string } = {}) {
    setLoading(true);
    setError("");
    try {
      const response = await getPublicProducts({
        search: filters.search || undefined,
        category: filters.category || undefined,
        stock: (filters.stock || undefined) as "IN_STOCK" | "OUT_OF_STOCK" | undefined
      });
      setProducts(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void getCategories().then((response) => setCategories(response.data ?? [])).catch(() => undefined);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load({ search, category, stock });
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Marketplace</span>
        <h1>Products</h1>
        <p>Browse products from approved businesses.</p>

        <form className="marketplace-filter" onSubmit={submit}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <select value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="">Any stock status</option>
            <option value="IN_STOCK">In stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
          <button type="submit">Apply</button>
        </form>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading products...</p>}
        {!loading && !error && products.length === 0 && <p>No products matched your search.</p>}

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
                  <p>Sold by <Link to={`/businesses/${product.business.slug}`}>{product.business.name}</Link></p>
                  <p>{product.business.university?.short_name || product.business.location_text}</p>
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
