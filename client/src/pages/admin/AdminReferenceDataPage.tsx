import { type FormEvent, useCallback, useEffect, useState } from "react";
import { GraduationCap, Grid3X3, Plus } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import {
  createCategory,
  getAdminCategories,
  updateCategory,
  type Category
} from "../../services/category.service";
import {
  createUniversity,
  getAdminUniversities,
  updateUniversity,
  type University
} from "../../services/university.service";

const inputClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function AdminReferenceDataPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [universityResponse, categoryResponse] = await Promise.all([
        getAdminUniversities(),
        getAdminCategories()
      ]);
      setUniversities(universityResponse.data ?? []);
      setCategories(categoryResponse.data ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleUniversitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setMessage("");

    try {
      await createUniversity({
        name: String(form.get("name") ?? ""),
        shortName: String(form.get("shortName") ?? "") || undefined,
        country: String(form.get("country") ?? "Ghana")
      });
      event.currentTarget.reset();
      setMessage("University created.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create university.");
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setMessage("");

    try {
      await createCategory({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? "") || undefined
      });
      event.currentTarget.reset();
      setMessage("Category created.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create category.");
    }
  }

  async function toggleUniversity(university: University) {
    setError("");
    try {
      await updateUniversity(university.id, { isActive: !university.is_active });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update university.");
    }
  }

  async function toggleCategory(category: Category) {
    setError("");
    try {
      await updateCategory(category.id, { isActive: !category.is_active });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update category.");
    }
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <AdminPageHeader
        eyebrow="Reference data"
        title="Universities & categories"
        description="Manage the database-backed options used across marketplace discovery and seller onboarding."
        icon={<Grid3X3 className="size-3.5" />}
      />

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {loading ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Universities</h2>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={handleUniversitySubmit}>
                <input className={inputClass} name="name" placeholder="University name" required minLength={2} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputClass} name="shortName" placeholder="Short name (optional)" />
                  <input className={inputClass} name="country" placeholder="Country" defaultValue="Ghana" required />
                </div>
                <button data-ui="admin-add-university" type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  <Plus className="size-4" />
                  Add university
                </button>
              </form>
            </div>

            <div className="divide-y divide-border">
              {universities.map((university) => (
                <div key={university.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <strong className="block text-sm">{university.name}</strong>
                    <span className="text-xs text-muted-foreground">{university.short_name ?? "—"} · {university.country}</span>
                  </div>
                  <button
                    data-ui="admin-toggle-university"
                    type="button"
                    onClick={() => void toggleUniversity(university)}
                    className="h-9 rounded-xl border border-border px-3 text-xs font-semibold"
                  >
                    {university.is_active ? "Disable" : "Reactivate"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <div className="flex items-center gap-2">
                <Grid3X3 className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Categories</h2>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={handleCategorySubmit}>
                <input className={inputClass} name="name" placeholder="Category name" required minLength={2} />
                <input className={inputClass} name="description" placeholder="Description (optional)" />
                <button data-ui="admin-add-category" type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  <Plus className="size-4" />
                  Add category
                </button>
              </form>
            </div>

            <div className="divide-y divide-border">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <strong className="block text-sm">{category.name}</strong>
                    <Badge variant={category.is_active ? "success" : "secondary"} className="mt-1">
                      {category.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <button
                    data-ui="admin-toggle-category"
                    type="button"
                    onClick={() => void toggleCategory(category)}
                    className="h-9 rounded-xl border border-border px-3 text-xs font-semibold"
                  >
                    {category.is_active ? "Disable" : "Reactivate"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
