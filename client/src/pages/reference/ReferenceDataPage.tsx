import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Grid3X3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getCategories, type Category } from "../../services/category.service";
import { getUniversities, type University } from "../../services/university.service";

export function ReferenceDataPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([getUniversities(), getCategories()])
      .then(([universityResponse, categoryResponse]) => {
        setUniversities(universityResponse.data ?? []);
        setCategories(categoryResponse.data ?? []);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error ? reason.message : "Unable to load reference data."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="rounded-[1.75rem] border border-border bg-gradient-to-br from-accent/60 via-card to-background p-6 shadow-sm sm:p-8">
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <BookOpen className="size-3.5" />
            Marketplace reference data
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.04em] sm:text-4xl">
            Universities & categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            These options are loaded from the marketplace database and used across discovery and seller onboarding.
          </p>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-2xl bg-muted" />
            <div className="h-96 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <GraduationCap className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Universities</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{universities.length} available</p>
                </div>
              </div>

              <div className="divide-y divide-border">
                {universities.map((university) => (
                  <article key={university.id} className="flex items-start gap-3 p-4">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <strong className="block text-sm">{university.name}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {university.short_name ?? "No abbreviation"} · {university.country}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <Grid3X3 className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Categories</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{categories.length} available</p>
                </div>
              </div>

              <div className="divide-y divide-border">
                {categories.map((category) => (
                  <article key={category.id} className="p-4">
                    <strong className="block text-sm">{category.name}</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {category.description ?? "No description"}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            to="/products"
          >
            Browse products
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
            to="/"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
