import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBusinesses, updateMyBusinessAvailability, type ManagedBusiness } from "../../services/business.service";

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
        setBusinesses((current) => current.map((item) => item.id === business.id ? response.data! : item));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update availability.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 07A</span>
        <h1>My businesses</h1>
        <p>Switch between your approved businesses, update their information, and control whether customers should currently see them as available.</p>

        {error && <p className="message message--error">{error}</p>}

        {loading ? (
          <p>Loading businesses...</p>
        ) : businesses.length === 0 ? (
          <div className="info-box">
            <p>You do not have an approved business yet.</p>
            <Link to="/sell">View seller applications</Link>
          </div>
        ) : (
          <ul className="business-list">
            {businesses.map((business) => (
              <li key={business.id} className="business-list__item">
                <div className="business-summary">
                  <div>
                    <strong>{business.name}</strong>
                    <span>{business.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}</span>
                    {business.university && <span>{business.university.short_name ?? business.university.name}</span>}
                    <span>Platform status: {business.status}</span>
                    <span>Availability: {business.availability_status === "OPEN" ? "Open" : "Currently unavailable"}</span>
                  </div>
                  <div className="actions">
                    <Link className="button-link" to={`/seller/businesses/${business.id}`}>Manage</Link>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={busyId === business.id}
                      onClick={() => void toggleAvailability(business)}
                    >
                      {busyId === business.id
                        ? "Updating..."
                        : business.availability_status === "OPEN"
                          ? "Set unavailable"
                          : "Set open"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
          <Link className="button-link button-link--secondary" to="/sell">Seller applications</Link>
        </div>
      </section>
    </main>
  );
}
