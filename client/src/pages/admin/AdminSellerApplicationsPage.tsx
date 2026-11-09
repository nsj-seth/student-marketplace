import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminEmptyState, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
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
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <AdminPageHeader
        eyebrow="Admin review"
        title="Seller applications"
        description="Review submitted seller applications and approve or reject marketplace access."
        icon={<Store className="size-3.5" />}
      />

      <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        {FILTERS.map((item) => (
          <button
            data-ui="admin-seller-filter"
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={
              "rounded-xl px-4 py-2 text-sm font-semibold transition " +
              (filter === item.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-5">
          <AdminEmptyState
            icon={<Store className="size-6" />}
            title="No applications found"
            description="No seller applications match the selected filter."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-lg">{application.business_name ?? "Unnamed business"}</strong>
                  <Badge variant={application.status === "PENDING" ? "warning" : application.status === "APPROVED" ? "success" : "destructive"}>
                    {application.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Applicant: {application.applicant?.full_name ?? application.applicant_id}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Type: {application.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}
                </p>
                {application.submitted_at && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    Submitted {new Date(application.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>

              <Link
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                to={"/admin/seller-applications/" + application.id}
              >
                Review <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
