import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getMarketplaceManagement,
  setFeaturedBusiness,
  setFeaturedProduct,
  type MarketplaceManagementData
} from "../../services/admin-marketplace.service";

function money(value: number) {
  return "GH₵" + value.toFixed(2);
}

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
    return (data?.products ?? []).filter((item) =>
      !term || (item.name + " " + item.business_name).toLowerCase().includes(term)
    );
  }, [data, productSearch]);

  async function toggleBusiness(id: string, featured: boolean) {
    setSavingId(id);
    setError("");
    try {
      await setFeaturedBusiness(id, featured);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update featured business.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleProduct(id: string, featured: boolean) {
    setSavingId(id);
    setError("");
    try {
      await setFeaturedProduct(id, featured);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update featured product.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <AdminPageHeader
        eyebrow="Marketplace curation"
        title="Featured listings"
        description="Choose which active businesses and public products appear in the homepage featured sections."
        icon={<Sparkles className="size-3.5" />}
      />

      {error && <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">{error}</div>}

      {loading ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.14em] text-primary-text">Businesses</span>
                  <h2 className="mt-1 text-lg font-semibold">Featured stores</h2>
                </div>
                <Badge variant="secondary">
                  {data?.businesses.filter((item) => item.is_featured).length ?? 0} featured
                </Badge>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Search businesses"
                />
              </div>
            </div>

            <div className="divide-y divide-border">
              {businesses.map((business) => (
                <article key={business.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm">{business.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      {business.business_type.replaceAll("_", " ")} · {business.status}
                    </span>
                  </div>
                  <button
                    data-ui="admin-feature-business"
                    type="button"
                    disabled={savingId === business.id || (!business.is_featured && business.status !== "ACTIVE")}
                    onClick={() => void toggleBusiness(business.id, !business.is_featured)}
                    className={
                      "h-9 shrink-0 rounded-xl border px-3 text-xs font-semibold disabled:saturate-50 " +
                      (business.is_featured
                        ? "border-danger-border bg-danger-soft text-danger-foreground"
                        : "border-primary/20 bg-primary/5 text-primary-text")
                    }
                  >
                    {savingId === business.id ? "Saving..." : business.is_featured ? "Remove featured" : "Feature"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.14em] text-primary-text">Products</span>
                  <h2 className="mt-1 text-lg font-semibold">Featured products</h2>
                </div>
                <Badge variant="secondary">
                  {data?.products.filter((item) => item.is_featured).length ?? 0} featured
                </Badge>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Search products or businesses"
                />
              </div>
            </div>

            <div className="divide-y divide-border">
              {products.map((product) => {
                const publicEligible =
                  (product.status === "ACTIVE" || product.status === "OUT_OF_STOCK") &&
                  product.business_status === "ACTIVE";

                return (
                  <article key={product.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm">{product.name}</strong>
                      <span className="block truncate text-xs text-muted-foreground">
                        {product.business_name} · {money(product.price)} · {product.status}
                        {product.business_status !== "ACTIVE" ? " · business " + product.business_status : ""}
                      </span>
                    </div>
                    <button
                      data-ui="admin-feature-product"
                      type="button"
                      disabled={savingId === product.id || (!product.is_featured && !publicEligible)}
                      onClick={() => void toggleProduct(product.id, !product.is_featured)}
                      className={
                        "h-9 shrink-0 rounded-xl border px-3 text-xs font-semibold disabled:saturate-50 " +
                        (product.is_featured
                          ? "border-danger-border bg-danger-soft text-danger-foreground"
                          : "border-primary/20 bg-primary/5 text-primary-text")
                      }
                    >
                      {savingId === product.id ? "Saving..." : product.is_featured ? "Remove featured" : "Feature"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
