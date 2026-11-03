import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  MapPin,
  Power,
  Settings2,
  Store
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  getMyBusinesses,
  updateMyBusinessAvailability,
  type ManagedBusiness
} from "../../services/business.service";

export function MyBusinessesPage() {
  const [businesses, setBusinesses] = useState<ManagedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const response = await getMyBusinesses();
      setBusinesses(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load businesses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleAvailability(business: ManagedBusiness) {
    setBusyId(business.id);
    setError(null);

    try {
      const nextStatus = business.availability_status === "OPEN" ? "UNAVAILABLE" : "OPEN";
      const response = await updateMyBusinessAvailability(business.id, nextStatus);

      if (response.data) {
        setBusinesses((current) =>
          current.map((item) => (item.id === business.id ? response.data! : item))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update availability.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <Building2 className="size-3.5" />
            Seller Hub · Businesses
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.04em]">Your businesses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage storefront availability, details and product catalogues across your approved businesses.
          </p>
        </div>

        <Link
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
          to="/sell"
        >
          Seller applications
        </Link>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
          <Building2 className="size-7 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">No approved business yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Start or continue a seller application to create your first storefront.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            to="/sell"
          >
            Start selling
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {businesses.map((business) => (
            <article
              key={business.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/30 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                    {business.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{business.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <span className="truncate">
                        {business.university?.short_name ??
                          business.university?.name ??
                          business.location_text}
                      </span>
                    </p>
                  </div>
                </div>

                <Badge variant={business.availability_status === "OPEN" ? "success" : "secondary"}>
                  {business.availability_status === "OPEN" ? "Open" : "Unavailable"}
                </Badge>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Business type</span>
                    <strong className="mt-1 block text-sm">
                      {business.business_type === "STUDENT_BUSINESS"
                        ? "Student Business"
                        : "Community Business"}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Platform status</span>
                    <strong className="mt-1 block text-sm">{business.status}</strong>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {business.categories.slice(0, 4).map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                    to={"/seller/businesses/" + business.id}
                  >
                    <Settings2 className="size-4" />
                    Manage
                  </Link>

                  <Link
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
                    to={"/seller/businesses/" + business.id + "/products"}
                  >
                    <Store className="size-4" />
                    Products
                  </Link>

                  <button
                    data-ui="seller-business-availability"
                    type="button"
                    disabled={busyId === business.id}
                    onClick={() => void toggleAvailability(business)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                  >
                    <Power className="size-4" />
                    {busyId === business.id
                      ? "Updating..."
                      : business.availability_status === "OPEN"
                        ? "Set unavailable"
                        : "Set open"}
                  </button>
                </div>

                <Link
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                  to={"/businesses/" + business.slug}
                >
                  View public storefront <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
