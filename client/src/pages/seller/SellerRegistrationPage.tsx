import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  GraduationCap,
  Store,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import {
  createSellerApplication,
  getMySellerApplications,
  type BusinessType,
  type SellerApplication
} from "../../services/seller-application.service";

function businessTypeLabel(type: BusinessType) {
  return type === "STUDENT_BUSINESS" ? "Student Business" : "Community Business";
}

function statusVariant(status: SellerApplication["status"]) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "destructive";
  if (status === "PENDING") return "warning";
  return "secondary";
}

export function SellerRegistrationPage() {
  const { refreshRoles } = useAuth();
  const [businessType, setBusinessType] = useState<BusinessType>("STUDENT_BUSINESS");
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadApplications() {
    try {
      const response = await getMySellerApplications();
      const nextApplications = response.data ?? [];
      setApplications(nextApplications);

      if (nextApplications.some((application) => application.status === "APPROVED")) {
        await refreshRoles();
      }
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
      setMessage(businessTypeLabel(businessType) + " seller application draft is ready.");
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
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1180px,calc(100%-32px))]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm sm:p-8">
          <Badge className="border-border bg-accent text-accent-foreground">
            Seller onboarding
          </Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.025em] sm:text-4xl">
            Turn your business into a marketplace storefront.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Start an application, verify student status where required, add your business details, then submit for admin review.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["1", "Choose business type", "Student or community business"],
              ["2", "Complete verification", "Student email only when required"],
              ["3", "Submit for review", "Admin approval creates your storefront"]
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-2xl border border-border bg-muted/40 p-4 backdrop-blur">
                <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground text-sm font-bold">{step}</span>
                <strong className="mt-3 block text-sm">{title}</strong>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
              </div>
            ))}
          </div>
        </section>

        {message && (
          <div className="mt-5 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-[92px] lg:self-start">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">
              Start an application
            </span>
            <h2 className="mt-2 text-xl font-semibold">Choose business type</h2>

            <form className="mt-5 space-y-3" onSubmit={handleStart}>
              <button
                data-ui="seller-type-student"
                type="button"
                onClick={() => setBusinessType("STUDENT_BUSINESS")}
                className={
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition " +
                  (businessType === "STUDENT_BUSINESS"
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : "border-border bg-background hover:bg-muted/40")
                }
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <GraduationCap className="size-5" />
                </span>
                <span>
                  <strong className="block text-sm">Student Business</strong>
                  <small className="mt-1 block leading-5 text-muted-foreground">
                    Requires verification of a supported university student email.
                  </small>
                </span>
              </button>

              <button
                data-ui="seller-type-community"
                type="button"
                onClick={() => setBusinessType("OTHER_BUSINESS")}
                className={
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition " +
                  (businessType === "OTHER_BUSINESS"
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : "border-border bg-background hover:bg-muted/40")
                }
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-text">
                  <Building2 className="size-5" />
                </span>
                <span>
                  <strong className="block text-sm">Community Business</strong>
                  <small className="mt-1 block leading-5 text-muted-foreground">
                    Student verification is not required, but admin approval still is.
                  </small>
                </span>
              </button>

              <button
                data-ui="seller-start"
                type="submit"
                disabled={saving}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50"
              >
                <Store className="size-4" />
                {saving ? "Starting..." : "Start seller application"}
              </button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Applications</span>
                <h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">Your seller applications</h2>
              </div>
              <span className="text-sm text-muted-foreground">{applications.length} total</span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-48 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <Store className="size-7 text-primary-text" />
                <h3 className="mt-4 text-xl font-semibold">No applications yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Choose a business type to begin your first seller application.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <article key={application.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="text-xs font-semibold text-primary-text">
                          {businessTypeLabel(application.business_type)}
                        </span>
                        <h3 className="mt-1 text-lg font-semibold">
                          {application.business_name || "Seller application"}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Started {new Date(application.created_at).toLocaleString()}
                        </p>
                      </div>

                      <Badge variant={statusVariant(application.status) as any}>
                        {application.status}
                      </Badge>
                    </div>

                    {application.status === "DRAFT" && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {application.business_type === "STUDENT_BUSINESS" && (
                          <Link
                            className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                            to={"/sell/applications/" + application.id + "/student-verification"}
                          >
                            <span className="flex items-center gap-2">
                              <BadgeCheck className="size-4 text-primary-text" />
                              Verify student email
                            </span>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </Link>
                        )}

                        <Link
                          className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                          to={"/sell/applications/" + application.id + "/business-details"}
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="size-4 text-primary-text" />
                            Business details
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </Link>
                      </div>
                    )}

                    {application.status === "PENDING" && (
                      <div className="mt-5 flex gap-3 rounded-xl bg-warning-soft p-4">
                        <Clock3 className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                        <p className="m-0 text-sm leading-6 text-warning-foreground">
                          Your application has been submitted and is waiting for admin review.
                        </p>
                      </div>
                    )}

                    {application.status === "APPROVED" && (
                      <div className="mt-5 rounded-xl border border-success-border bg-success-soft p-4">
                        <div className="flex gap-3">
                          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                          <div>
                            <strong className="text-sm text-success-foreground">Approved</strong>
                            <p className="mt-1 text-sm leading-6 text-success-foreground">
                              Your business has been created and seller access has been granted.
                            </p>
                          </div>
                        </div>
                        <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-success-foreground" to="/seller/businesses">
                          Manage my businesses <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    )}

                    {application.status === "REJECTED" && (
                      <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft p-4">
                        <div className="flex gap-3">
                          <XCircle className="mt-0.5 size-4 shrink-0 text-danger-foreground" />
                          <div>
                            <strong className="text-sm text-danger-foreground">Application rejected</strong>
                            <p className="mt-1 text-sm leading-6 text-danger-foreground">
                              {application.review_note || "The application was not approved."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
