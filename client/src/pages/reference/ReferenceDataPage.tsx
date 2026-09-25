import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        setError(reason instanceof Error ? reason.message : "Unable to load reference data.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <span className="eyebrow">Phase 04</span>
        <h1>Marketplace reference data</h1>
        <p>These lists come from the database. They are not hard-coded into the frontend.</p>

        {loading && <p>Loading...</p>}
        {error && <p className="message message--error">{error}</p>}

        {!loading && !error && (
          <div className="reference-grid">
            <section>
              <h2>Universities</h2>
              <ul className="simple-list">
                {universities.map((university) => (
                  <li key={university.id}>
                    <strong>{university.name}</strong>
                    <span>{university.short_name ?? "No abbreviation"} · {university.country}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Categories</h2>
              <ul className="simple-list">
                {categories.map((category) => (
                  <li key={category.id}>
                    <strong>{category.name}</strong>
                    <span>{category.description ?? "No description"}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
