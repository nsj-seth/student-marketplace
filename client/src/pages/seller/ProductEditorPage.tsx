import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMyBusiness, type ManagedBusiness } from "../../services/business.service";
import {
  createSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  type ManagedProduct
} from "../../services/product.service";

export function ProductEditorPage() {
  const { businessId, productId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(productId);
  const [business, setBusiness] = useState<ManagedBusiness | null>(null);
  const [product, setProduct] = useState<ManagedProduct | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!businessId) return;
      try {
        setError(null);
        const businessResponse = await getMyBusiness(businessId);
        const nextBusiness = businessResponse.data ?? null;
        setBusiness(nextBusiness);
        if (!editing) {
          setCategoryId(nextBusiness?.category_ids[0] ?? "");
        } else if (productId) {
          const response = await getSellerProduct(businessId, productId);
          const next = response.data ?? null;
          setProduct(next);
          if (next) {
            setName(next.name); setDescription(next.description); setPrice(String(next.price));
            setQuantity(String(next.stock_quantity)); setCategoryId(next.category_id);
          }
        }
      } catch (err) { setError(err instanceof Error ? err.message : "Unable to load product form."); }
      finally { setLoading(false); }
    }
    void load();
  }, [businessId, productId, editing]);

  const valid = useMemo(() => {
    const numericPrice = Number(price); const numericQuantity = Number(quantity);
    return name.trim().length >= 2 && description.trim().length >= 1 && categoryId && Number.isFinite(numericPrice) && numericPrice >= 0 && Number.isInteger(numericQuantity) && numericQuantity >= 0;
  }, [name, description, price, quantity, categoryId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!businessId || !valid) return;
    setSaving(true); setError(null);
    const input = { name, description, price: Number(price), quantity: Number(quantity), categoryId };
    try {
      if (editing && productId) await updateSellerProduct(businessId, productId, input);
      else await createSellerProduct(businessId, input);
      navigate(`/seller/businesses/${businessId}/products`);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save product."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="wide-shell"><section className="wide-card card"><p>Loading...</p></section></main>;
  if (!business) return <main className="wide-shell"><section className="wide-card card"><h1>Business not found</h1>{error && <p className="message message--error">{error}</p>}</section></main>;

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 08B</span>
        <h1>{editing ? `Edit ${product?.name ?? "product"}` : `Add product to ${business.name}`}</h1>
        <p>Manage the product details here. Existing products can manage their image gallery separately.</p>
        <form className="compact-form" onSubmit={submit}>
          <label>Product name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Description<textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
          <label>Price (GH₵)<input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
          <label>Available quantity<input type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label>Category
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
              <option value="">Choose category</option>
              {business.categories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <button type="submit" disabled={!valid || saving}>{saving ? "Saving..." : editing ? "Save product" : "Create product"}</button>
        </form>
        {error && <p className="message message--error">{error}</p>}
        <div className="actions"><Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}/products`}>Back to products</Link>{editing && productId && <Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}/products/${productId}/images`}>Manage images</Link>}</div>
      </section>
    </main>
  );
}
