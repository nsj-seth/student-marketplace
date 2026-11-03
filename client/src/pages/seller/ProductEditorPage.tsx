import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageIcon, PackagePlus, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getMyBusiness,
  type ManagedBusiness
} from "../../services/business.service";
import {
  createSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  type ManagedProduct
} from "../../services/product.service";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

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
            setName(next.name);
            setDescription(next.description);
            setPrice(String(next.price));
            setQuantity(String(next.stock_quantity));
            setCategoryId(next.category_id);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load product form."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [businessId, productId, editing]);

  const valid = useMemo(() => {
    const numericPrice = Number(price);
    const numericQuantity = Number(quantity);

    return (
      name.trim().length >= 2 &&
      description.trim().length >= 1 &&
      Boolean(categoryId) &&
      Number.isFinite(numericPrice) &&
      numericPrice >= 0 &&
      Number.isInteger(numericQuantity) &&
      numericQuantity >= 0
    );
  }, [name, description, price, quantity, categoryId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!businessId || !valid) return;

    setSaving(true);
    setError(null);

    const input = {
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      categoryId
    };

    try {
      if (editing && productId) {
        await updateSellerProduct(businessId, productId, input);
      } else {
        await createSellerProduct(businessId, input);
      }

      navigate("/seller/businesses/" + businessId + "/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <PackagePlus className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Business not found</h1>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <PackagePlus className="size-3.5" />
            Seller Hub · Product editor
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.04em]">
            {editing
              ? "Edit " + (product?.name ?? "product")
              : "Add product to " + business.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage the product details here. Product images are handled separately after creation.
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          to={"/seller/businesses/" + businessId + "/products"}
        >
          <ArrowLeft className="size-4" />
          Back to products
        </Link>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        onSubmit={submit}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
            Product name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
            Description
            <textarea
              data-ui="product-description"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Price (GH₵)
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Available quantity
            <Input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
            Category
            <select
              className={selectClass}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            >
              <option value="">Choose category</option>
              {business.categories
                .filter((category) => category.is_active)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            data-ui="product-save"
            type="submit"
            disabled={!valid || saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving
              ? "Saving..."
              : editing
                ? "Save product"
                : "Create product"}
          </button>

          {editing && productId && (
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground"
              to={
                "/seller/businesses/" +
                businessId +
                "/products/" +
                productId +
                "/images"
              }
            >
              <ImageIcon className="size-4" />
              Manage images
            </Link>
          )}
        </div>
      </form>
    </main>
  );
}
