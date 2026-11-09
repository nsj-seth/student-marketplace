import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Building2, GraduationCap, Store } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
      setMessage(
        decision === "APPROVE"
          ? "Application approved and business created."
          : "Application rejected."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review seller application.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  if (!application) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Store className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Application not found</h1>
          <p className="mt-2 text-sm text-danger-foreground">{error}</p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/admin/seller-applications">
            <ArrowLeft className="size-4" />
            Back to applications
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/admin/seller-applications">
          <ArrowLeft className="size-4" />
          Seller applications
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.14em] text-primary-text">Application review</span>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">{application.business_name ?? "Seller application"}</h1>
          </div>
          <Badge variant={application.status === "PENDING" ? "warning" : application.status === "APPROVED" ? "success" : "destructive"}>
            {application.status}
          </Badge>
        </div>
      </section>

      {message && <div className="mt-5 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">{message}</div>}
      {error && <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">{error}</div>}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary-text" />
            <h2 className="text-lg font-semibold">Applicant</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">Name</span>
              <strong className="mt-1 block text-sm">{application.applicant?.full_name ?? "Unknown"}</strong>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">Business type</span>
              <strong className="mt-1 block text-sm">{application.business_type.replaceAll("_", " ")}</strong>
            </div>

            {application.student_verification && (
              <>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Student email</span>
                  <strong className="mt-1 block text-sm">{application.student_verification.student_email}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Verification</span>
                  <strong className="mt-1 block text-sm">{application.student_verification.status}</strong>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">University</span>
                  <strong className="mt-1 block text-sm">{application.student_verification.university?.name ?? "Not available"}</strong>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary-text" />
            <h2 className="text-lg font-semibold">Business details</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <p><strong>Description:</strong> <span className="text-muted-foreground">{application.description}</span></p>
            <p><strong>Location:</strong> <span className="text-muted-foreground">{application.location_text}</span></p>
            <p><strong>Phone:</strong> <span className="text-muted-foreground">{application.contact_phone}</span></p>
            <p><strong>Categories:</strong> <span className="text-muted-foreground">{application.categories.map((category) => category.name).join(", ") || "None"}</span></p>
            <p><strong>Pickup:</strong> <span className="text-muted-foreground">{application.pickup_enabled ? "Yes" : "No"}</span></p>
            <p><strong>Seller delivery:</strong> <span className="text-muted-foreground">{application.seller_delivery_enabled ? "Yes" : "No"}</span></p>
            <p><strong>Logo path:</strong> <span className="break-all text-muted-foreground">{application.logo_path ?? "None"}</span></p>
          </div>
        </section>
      </div>

      {application.status === "PENDING" ? (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-primary-text" />
            <h2 className="text-lg font-semibold">Review decision</h2>
          </div>

          <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Review note / rejection reason
            <textarea
              data-ui="admin-application-note"
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              data-ui="admin-application-approve"
              type="button"
              disabled={saving}
              onClick={() => void review("APPROVE")}
              className="h-10 rounded-xl bg-success-strong px-4 text-sm font-semibold text-white disabled:saturate-50"
            >
              Approve
            </button>
            <button
              data-ui="admin-application-reject"
              type="button"
              disabled={saving}
              onClick={() => void review("REJECT")}
              className="h-10 rounded-xl border border-danger-border bg-danger-soft px-4 text-sm font-semibold text-danger-foreground disabled:saturate-50"
            >
              Reject
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Review complete</h2>
          <p className="mt-2 text-sm text-muted-foreground">This application has already been reviewed.</p>
          {application.review_note && <p className="mt-3 text-sm"><strong>Review note:</strong> {application.review_note}</p>}
          {application.business_id && <p className="mt-2 text-sm"><strong>Created business ID:</strong> {application.business_id}</p>}
        </section>
      )}
    </main>
  );
}
