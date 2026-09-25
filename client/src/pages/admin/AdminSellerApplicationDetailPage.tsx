import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminSellerApplication,
  reviewAdminSellerApplication,
  type AdminSellerApplication
} from "../../services/admin-seller-application.service";

export function AdminSellerApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState<AdminSellerApplication | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      const response = await getAdminSellerApplication(id);
      setApplication(response.data ?? null);
      setNote(response.data?.review_note ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load seller application.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function review(decision: "APPROVE" | "REJECT") {
    if (!id) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await reviewAdminSellerApplication(id, { decision, note });
      setApplication(response.data ?? null);
      setMessage(decision === "APPROVE" ? "Application approved and business created." : "Application rejected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review seller application.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="page-shell"><section className="card"><p>Loading application...</p></section></main>;
  if (!application) return <main className="page-shell"><section className="card"><p>{error ?? "Application not found."}</p><Link to="/admin/seller-applications">Back</Link></section></main>;

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 06</span>
        <h1>{application.business_name ?? "Seller application"}</h1>
        <p>Status: <strong>{application.status}</strong></p>

        <div className="detail-grid">
          <section>
            <h2>Applicant</h2>
            <p><strong>Name:</strong> {application.applicant?.full_name ?? "Unknown"}</p>
            <p><strong>Business type:</strong> {application.business_type}</p>
            {application.student_verification && (
              <>
                <p><strong>Student email:</strong> {application.student_verification.student_email}</p>
                <p><strong>Verification:</strong> {application.student_verification.status}</p>
                <p><strong>University:</strong> {application.student_verification.university?.name ?? "Not available"}</p>
              </>
            )}
          </section>

          <section>
            <h2>Business details</h2>
            <p><strong>Description:</strong> {application.description}</p>
            <p><strong>Location:</strong> {application.location_text}</p>
            <p><strong>Phone:</strong> {application.contact_phone}</p>
            <p><strong>Categories:</strong> {application.categories.map((category) => category.name).join(", ") || "None"}</p>
            <p><strong>Pickup:</strong> {application.pickup_enabled ? "Yes" : "No"}</p>
            <p><strong>Seller delivery:</strong> {application.seller_delivery_enabled ? "Yes" : "No"}</p>
            <p><strong>Logo path:</strong> {application.logo_path ?? "None"}</p>
          </section>
        </div>

        {application.status === "PENDING" ? (
          <section className="review-panel">
            <label>
              Review note / rejection reason
              <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <div className="actions">
              <button type="button" disabled={saving} onClick={() => void review("APPROVE")}>Approve</button>
              <button type="button" className="danger-button" disabled={saving} onClick={() => void review("REJECT")}>Reject</button>
            </div>
          </section>
        ) : (
          <div className="info-box">
            <p>This application has already been reviewed.</p>
            {application.review_note && <p><strong>Review note:</strong> {application.review_note}</p>}
            {application.business_id && <p><strong>Created business ID:</strong> {application.business_id}</p>}
          </div>
        )}

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/admin/seller-applications">Back to applications</Link>
          <Link className="button-link button-link--secondary" to="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
