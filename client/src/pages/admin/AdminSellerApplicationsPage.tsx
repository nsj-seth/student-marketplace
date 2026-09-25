import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminSellerApplications,
  type AdminSellerApplication
} from "../../services/admin-seller-application.service";
import type { SellerApplicationStatus } from "../../services/seller-application.service";

const FILTERS: Array<{ label: string; value: SellerApplicationStatus | "ALL" }> = [
  { label: "Pending", value: "PENDING" },
  { label: "All", value: "ALL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" }
];

export function AdminSellerApplicationsPage() {
  const [filter, setFilter] = useState<SellerApplicationStatus | "ALL">("PENDING");
  const [applications, setApplications] = useState<AdminSellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void getAdminSellerApplications(filter === "ALL" ? undefined : filter)
      .then((response) => {
        if (active) setApplications(response.data ?? []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load seller applications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [filter]);

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 06</span>
        <h1>Seller applications</h1>
        <p>Review submitted seller applications and approve or reject them.</p>

        <div className="actions">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "" : "secondary-button"}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <p className="message message--error">{error}</p>}

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No seller applications match this filter.</p>
        ) : (
          <ul className="management-list admin-application-list">
            {applications.map((application) => (
              <li key={application.id}>
                <div>
                  <strong>{application.business_name ?? "Unnamed business"}</strong>
                  <span>Applicant: {application.applicant?.full_name ?? application.applicant_id}</span>
                  <span>Type: {application.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}</span>
                  <span>Status: {application.status}</span>
                  {application.submitted_at && (
                    <span>Submitted: {new Date(application.submitted_at).toLocaleString()}</span>
                  )}
                </div>
                <Link className="button-link" to={`/admin/seller-applications/${application.id}`}>
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
