import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    void load();
  }, [load]);

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
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Admin · Phase 04</span>
        <h1>Universities & categories</h1>
        <p>Minimal administration UI for database-managed marketplace reference data.</p>

        {error && <p className="message message--error">{error}</p>}
        {message && <p className="message message--success">{message}</p>}
        {loading && <p>Loading...</p>}

        <div className="admin-grid">
          <section className="admin-section">
            <h2>Universities</h2>
            <form className="compact-form" onSubmit={handleUniversitySubmit}>
              <input name="name" placeholder="University name" required minLength={2} />
              <input name="shortName" placeholder="Short name (optional)" />
              <input name="country" placeholder="Country" defaultValue="Ghana" required />
              <button type="submit">Add university</button>
            </form>

            <ul className="management-list">
              {universities.map((university) => (
                <li key={university.id}>
                  <div>
                    <strong>{university.name}</strong>
                    <span>{university.short_name ?? "—"} · {university.country}</span>
                  </div>
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => void toggleUniversity(university)}
                  >
                    {university.is_active ? "Disable" : "Reactivate"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-section">
            <h2>Categories</h2>
            <form className="compact-form" onSubmit={handleCategorySubmit}>
              <input name="name" placeholder="Category name" required minLength={2} />
              <input name="description" placeholder="Description (optional)" />
              <button type="submit">Add category</button>
            </form>

            <ul className="management-list">
              {categories.map((category) => (
                <li key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <span>{category.is_active ? "Active" : "Disabled"}</span>
                  </div>
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => void toggleCategory(category)}
                  >
                    {category.is_active ? "Disable" : "Reactivate"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
          <Link className="button-link button-link--secondary" to="/reference-data">Public view</Link>
        </div>
      </section>
    </main>
  );
}
