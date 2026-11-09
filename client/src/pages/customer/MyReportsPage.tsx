import { useEffect, useState } from "react";
import { FileWarning, ShieldAlert } from "lucide-react";
import { AccountNav } from "../../components/account/AccountNav";
import { Badge } from "@/components/ui/badge";
import { getMyReports, type ReportRecord } from "../../services/report.service";

export function MyReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyReports()
      .then((response) => setReports(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load reports."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-gradient-to-br from-accent/60 via-card to-background p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <ShieldAlert className="size-3.5" />
              Safety
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.04em]">My reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review moderation requests you have submitted to marketplace administrators.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-center shadow-sm">
            <strong className="block text-2xl">{reports.length}</strong>
            <span className="text-xs text-muted-foreground">submitted report{reports.length === 1 ? "" : "s"}</span>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />

          <section className="min-w-0">
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
                {error}
              </div>
            )}

            {!loading && !error && reports.length === 0 && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary-text shadow-sm">
                  <FileWarning className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">No reports submitted</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Reports you submit from products, stores or sellers will appear here.
                </p>
              </div>
            )}

            {!loading && reports.length > 0 && (
              <div className="space-y-4">
                {reports.map((report) => (
                  <article
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                    key={report.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[.12em] text-primary-text">
                          {report.target_type.replaceAll("_", " ")}
                        </span>
                        <h2 className="mt-1 text-lg font-semibold">
                          {report.target_label ?? report.target_type}
                        </h2>
                      </div>
                      <Badge variant="outline">{report.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 rounded-xl bg-muted/50 p-4">
                      <span className="text-xs text-muted-foreground">Reason</span>
                      <strong className="mt-1 block text-sm">{report.reason.replaceAll("_", " ")}</strong>
                    </div>

                    {report.description && (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">{report.description}</p>
                    )}

                    {report.admin_note && (
                      <div className="mt-4 rounded-xl border border-border bg-background p-4">
                        <span className="text-xs font-medium text-muted-foreground">Admin note</span>
                        <p className="mt-1 text-sm text-foreground">{report.admin_note}</p>
                      </div>
                    )}

                    <small className="mt-4 block text-xs text-muted-foreground">
                      Submitted {new Date(report.created_at).toLocaleString()}
                    </small>
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
