import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMarketplaceManagement, setFeaturedBusiness, setFeaturedProduct, type MarketplaceManagementData } from "../../services/admin-marketplace.service";

function money(value: number) { return `GH₵${value.toFixed(2)}`; }

export function AdminMarketplacePage() {
  const [data, setData] = useState<MarketplaceManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  async function load() {
    setError("");
    try {
      const response = await getMarketplaceManagement();
      setData(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load marketplace management.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const businesses = useMemo(() => {
    const term = businessSearch.trim().toLowerCase();
    return (data?.businesses ?? []).filter((item) => !term || item.name.toLowerCase().includes(term));
  }, [data, businessSearch]);

  const products = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return (data?.products ?? []).filter((item) => !term || `${item.name} ${item.business_name}`.toLowerCase().includes(term));
  }, [data, productSearch]);

  async function toggleBusiness(id: string, featured: boolean) {
    setSavingId(id); setError("");
    try { await setFeaturedBusiness(id, featured); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update featured business."); }
    finally { setSavingId(null); }
  }

  async function toggleProduct(id: string, featured: boolean) {
    setSavingId(id); setError("");
    try { await setFeaturedProduct(id, featured); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update featured product."); }
    finally { setSavingId(null); }
  }

  return (
    <main className="wide-shell admin-management-page">
      <section className="card wide-card">
        <span className="eyebrow">Admin marketplace management</span>
        <h1>Featured listings</h1>
        <p>Choose which active businesses and public products appear in the homepage featured sections.</p>
        {error && <p className="message message--error">{error}</p>}
        {loading ? <p>Loading marketplace listings...</p> : (
          <>
            <section className="admin-dashboard-panel">
              <div className="section-heading"><h2>Businesses</h2><span>{data?.businesses.filter((item) => item.is_featured).length ?? 0} featured</span></div>
              <input value={businessSearch} onChange={(e) => setBusinessSearch(e.target.value)} placeholder="Search businesses" />
              <div className="admin-feature-list">
                {businesses.map((business) => (
                  <article key={business.id}>
                    <div><strong>{business.name}</strong><span>{business.business_type.replaceAll("_", " ")} · {business.status}</span></div>
                    <button type="button" disabled={savingId === business.id || (!business.is_featured && business.status !== "ACTIVE")} onClick={() => void toggleBusiness(business.id, !business.is_featured)}>
                      {savingId === business.id ? "Saving..." : business.is_featured ? "Remove featured" : "Feature"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-dashboard-panel">
              <div className="section-heading"><h2>Products</h2><span>{data?.products.filter((item) => item.is_featured).length ?? 0} featured</span></div>
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products or businesses" />
              <div className="admin-feature-list">
                {products.map((product) => {
                  const publicEligible = (product.status === "ACTIVE" || product.status === "OUT_OF_STOCK") && product.business_status === "ACTIVE";
                  return (
                    <article key={product.id}>
                      <div><strong>{product.name}</strong><span>{product.business_name} · {money(product.price)} · {product.status}{product.business_status !== "ACTIVE" ? ` · business ${product.business_status}` : ""}</span></div>
                      <button type="button" disabled={savingId === product.id || (!product.is_featured && !publicEligible)} onClick={() => void toggleProduct(product.id, !product.is_featured)}>
                        {savingId === product.id ? "Saving..." : product.is_featured ? "Remove featured" : "Feature"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
        <div className="actions"><Link className="button-link button-link--secondary" to="/admin">Admin dashboard</Link><Link className="button-link button-link--secondary" to="/">Marketplace</Link></div>
      </section>
    </main>
  );
}
