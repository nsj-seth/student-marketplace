import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createSellerApplication,
  getMySellerApplications,
  type BusinessType,
  type SellerApplication
} from "../../services/seller-application.service";

function businessTypeLabel(type: BusinessType) {
  return type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business";
}

export function SellerRegistrationPage() {
  const [businessType, setBusinessType] = useState<BusinessType>("STUDENT_BUSINESS");
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadApplications() {
    try {
      const response = await getMySellerApplications();
      setApplications(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  async function handleStart(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await createSellerApplication(businessType);
      setMessage(
        `${businessTypeLabel(businessType)} seller application draft is ready.`
      );
      const created = response.data;
      if (created) {
        setApplications((current) => {
          const withoutSame = current.filter((item) => item.id !== created.id);
          return [created, ...withoutSame];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 05C</span>
        <h1>Become a seller</h1>
        <p>
          Start a seller application by choosing the type of business you want to register.
          Complete your seller onboarding by verifying student status where required, entering business details, uploading a logo, and submitting the application for admin review.
        </p>

        <div className="seller-registration-grid">
          <section>
            <h2>Start an application</h2>
            <form className="compact-form" onSubmit={handleStart}>
              <label>
                Business type
                <select
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value as BusinessType)}
                >
                  <option value="STUDENT_BUSINESS">Student Business</option>
                  <option value="OTHER_BUSINESS">Other Business</option>
                </select>
              </label>

              <div className="info-box">
                {businessType === "STUDENT_BUSINESS" ? (
                  <p>
                    You will verify a university student email before submitting the business for approval.
                  </p>
                ) : (
                  <p>
                    Student verification is not required. The business will still require admin approval.
                  </p>
                )}
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Starting..." : "Start seller application"}
              </button>
            </form>

            {message && <p className="message message--success">{message}</p>}
            {error && <p className="message message--error">{error}</p>}
          </section>

          <section>
            <h2>My applications</h2>
            {loading ? (
              <p>Loading applications...</p>
            ) : applications.length === 0 ? (
              <p>You have not started a seller application yet.</p>
            ) : (
              <ul className="management-list">
                {applications.map((application) => (
                  <li key={application.id}>
                    <div>
                      <strong>{businessTypeLabel(application.business_type)}</strong>
                      <span>Status: {application.status}</span>
                      <span>
                        Started {new Date(application.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="phase-note">
                      {application.status === "DRAFT" ? (
                        <div className="actions">
                          {application.business_type === "STUDENT_BUSINESS" && (
                            <Link to={`/sell/applications/${application.id}/student-verification`}>Verify student email</Link>
                          )}
                          <Link to={`/sell/applications/${application.id}/business-details`}>Business details</Link>
                        </div>
                      ) : (
                        application.status
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
