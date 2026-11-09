import { useEffect, useState } from "react";
import {
  Boxes,
  ImageIcon,
  PackagePlus,
  Pencil,
  Power,
  Save,
  Trash2
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      setQuantities(
        Object.fromEntries(next.map((product) => [product.id, String(product.stock_quantity)]))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [businessId]);

  function replaceProduct(next: ManagedProduct) {
    setProducts((current) =>
      current.map((product) => (product.id === next.id ? next : product))
    );
    setQuantities((current) => ({
      ...current,
      [next.id]: String(next.stock_quantity)
    }));
  }

  async function saveInventory(product: ManagedProduct) {
    if (!businessId) return;

    const quantity = Number(quantities[product.id]);
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Stock quantity must be a whole number of zero or more.");
      return;
    }

    setBusyId(product.id);
    setError(null);
    setMessage(null);

    try {
      const response = await updateSellerProductInventory(
        businessId,
        product.id,
        quantity
      );
      if (response.data) replaceProduct(response.data);
      setMessage(product.name + " stock updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update stock.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(product: ManagedProduct) {
    if (!businessId) return;

    setBusyId(product.id);
    setError(null);
    setMessage(null);

    try {
      const requested = product.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
      const response = await updateSellerProductStatus(
        businessId,
        product.id,
        requested
      );
      if (response.data) replaceProduct(response.data);
      setMessage(product.name + " status updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update product status."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(product: ManagedProduct) {
    if (
      !businessId ||
      !window.confirm(
        "Remove " +
          product.name +
          "? This keeps the record for historical integrity."
      )
    ) {
      return;
    }

    setBusyId(product.id);
    setError(null);
    setMessage(null);

    try {
      await removeSellerProduct(businessId, product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
      setMessage(product.name + " removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove product.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-60 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <Boxes className="size-3.5" />
            Seller Hub · Inventory
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.025em]">
            {business ? business.name + " products" : "Products"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage product details, stock, visibility and image galleries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {businessId && (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to={"/seller/businesses/" + businessId + "/products/new"}
            >
              <PackagePlus className="size-4" />
              Add product
            </Link>
          )}
          {businessId && (
            <Link
              className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
              to={"/seller/businesses/" + businessId}
            >
              Business settings
            </Link>
          )}
        </div>
      </section>

      {message && (
        <div className="mt-5 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
          <Boxes className="size-7 text-primary-text" />
          <h2 className="mt-4 text-xl font-semibold">No products yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first product to start building this storefront catalogue.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {products.map((product) => {
            const primary =
              product.images.find((image) => image.is_primary) ??
              product.images[0] ??
              null;
            const primaryUrl = primary
              ? supabase.storage
                  .from("product-images")
                  .getPublicUrl(primary.storage_path).data.publicUrl
              : null;

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div className="grid gap-5 p-5 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-xl border border-border bg-muted">
                    {primaryUrl ? (
                      <img
                        className="aspect-square h-full w-full object-cover"
                        src={primaryUrl}
                        alt={product.name}
                      />
                    ) : (
                      <div className="grid aspect-square place-items-center text-muted-foreground">
                        <ImageIcon className="size-7" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-primary-text">
                          {product.category?.name ?? "Unknown category"}
                        </span>
                        <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
                      </div>
                      <Badge
                        variant={
                          product.status === "ACTIVE"
                            ? "success"
                            : product.status === "OUT_OF_STOCK"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {product.status.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <p className="mt-2 text-lg font-bold">
                      GH₵{product.price.toFixed(2)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-end gap-2">
                      <label className="grid flex-1 gap-1.5 text-xs font-semibold text-muted-foreground">
                        Stock quantity
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            quantities[product.id] ??
                            String(product.stock_quantity)
                          }
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [product.id]: event.target.value
                            }))
                          }
                        />
                      </label>
                      <button
                        data-ui="seller-product-stock"
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => void saveInventory(product)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground"
                      >
                        <Save className="size-4" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 p-4">
                  {product.status !== "HIDDEN" && (
                    <button
                      data-ui="seller-product-status"
                      type="button"
                      disabled={busyId === product.id}
                      onClick={() => void toggleStatus(product)}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                    >
                      <Power className="size-3.5" />
                      {product.status === "INACTIVE"
                        ? "Activate"
                        : "Deactivate"}
                    </button>
                  )}

                  {businessId && (
                    <Link
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                      to={
                        "/seller/businesses/" +
                        businessId +
                        "/products/" +
                        product.id
                      }
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                  )}

                  {businessId && (
                    <Link
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                      to={
                        "/seller/businesses/" +
                        businessId +
                        "/products/" +
                        product.id +
                        "/images"
                      }
                    >
                      <ImageIcon className="size-3.5" />
                      Images ({product.images.length})
                    </Link>
                  )}

                  <button
                    data-ui="seller-product-remove"
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => void remove(product)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-danger-border bg-danger-soft px-3 text-xs font-semibold text-danger-foreground"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
