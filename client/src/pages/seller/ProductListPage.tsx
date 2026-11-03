import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyBusiness, type ManagedBusiness } from "../../services/business.service";
import { supabase } from "../../lib/supabase";
import {
  getSellerProducts,
  removeSellerProduct,
  updateSellerProductInventory,
  updateSellerProductStatus,
  type ManagedProduct
} from "../../services/product.service";

export function ProductListPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState<ManagedBusiness | null>(null);
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!businessId) return;
    try {
      setError(null);
      const [businessResponse, productResponse] = await Promise.all([
        getMyBusiness(businessId),
        getSellerProducts(businessId)
      ]);
      setBusiness(businessResponse.data ?? null);
      const next = productResponse.data ?? [];
      setProducts(next);
      setQuantities(Object.fromEntries(next.map((product) => [product.id, String(product.stock_quantity)])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [businessId]);

  function replaceProduct(next: ManagedProduct) {
    setProducts((current) => current.map((product) => product.id === next.id ? next : product));
    setQuantities((current) => ({ ...current, [next.id]: String(next.stock_quantity) }));
  }

  async function saveInventory(product: ManagedProduct) {
    if (!businessId) return;
    const quantity = Number(quantities[product.id]);
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Stock quantity must be a whole number of zero or more.");
      return;
    }
    setBusyId(product.id); setError(null); setMessage(null);
    try {
      const response = await updateSellerProductInventory(businessId, product.id, quantity);
      if (response.data) replaceProduct(response.data);
      setMessage(`${product.name} stock updated.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update stock."); }
    finally { setBusyId(null); }
  }

  async function toggleStatus(product: ManagedProduct) {
    if (!businessId) return;
    setBusyId(product.id); setError(null); setMessage(null);
    try {
      const requested = product.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
      const response = await updateSellerProductStatus(businessId, product.id, requested);
      if (response.data) replaceProduct(response.data);
      setMessage(`${product.name} status updated.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update product status."); }
    finally { setBusyId(null); }
  }

  async function remove(product: ManagedProduct) {
    if (!businessId || !window.confirm(`Remove ${product.name}? This keeps the record for historical integrity.`)) return;
    setBusyId(product.id); setError(null); setMessage(null);
    try {
      await removeSellerProduct(businessId, product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage(`${product.name} removed.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to remove product."); }
    finally { setBusyId(null); }
  }

  if (loading) return <main className="wide-shell seller-hub-page"><section className="wide-card card"><p>Loading products...</p></section></main>;

  return (
    <main className="wide-shell seller-hub-page">
      <section className="wide-card card">
        <span className="eyebrow">Seller Hub · Inventory</span>
        <h1>{business ? `${business.name} products` : "Products"}</h1>
        <p>Create and manage products, stock quantities, and product images.</p>

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}

        <div className="actions">
          {businessId && <Link className="button-link" to={`/seller/businesses/${businessId}/products/new`}>Add product</Link>}
          {businessId && <Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}`}>Business settings</Link>}
        </div>

        {products.length === 0 ? (
          <div className="info-box"><p>No products yet.</p></div>
        ) : (
          <div className="product-admin-list">
            {products.map((product) => (
              <article key={product.id} className="product-admin-item">
                <div>
                  {product.images.find((image) => image.is_primary) && (
                    <img
                      className="product-admin-thumbnail"
                      src={supabase.storage.from("product-images").getPublicUrl(product.images.find((image) => image.is_primary)!.storage_path).data.publicUrl}
                      alt={product.name}
                    />
                  )}
                  <h2>{product.name}</h2>
                  <p>{product.category?.name ?? "Unknown category"} · GH₵{product.price.toFixed(2)}</p>
                  <p>Status: <strong>{product.status}</strong></p>
                  <p>{product.description}</p>
                </div>
                <div className="compact-form product-admin-controls">
                  <label>Stock quantity
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantities[product.id] ?? String(product.stock_quantity)}
                      onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: event.target.value }))}
                    />
                  </label>
                  <div className="actions">
                    <button type="button" className="secondary-button" disabled={busyId === product.id} onClick={() => void saveInventory(product)}>Save stock</button>
                    {product.status !== "HIDDEN" && (
                      <button type="button" className="secondary-button" disabled={busyId === product.id} onClick={() => void toggleStatus(product)}>
                        {product.status === "INACTIVE" ? "Activate" : "Deactivate"}
                      </button>
                    )}
                    {businessId && <Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}/products/${product.id}`}>Edit</Link>}
                    {businessId && <Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}/products/${product.id}/images`}>Images ({product.images.length})</Link>}
                    <button type="button" className="danger-button" disabled={busyId === product.id} onClick={() => void remove(product)}>Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
