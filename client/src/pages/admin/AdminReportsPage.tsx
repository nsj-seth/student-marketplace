import { FormEvent, useEffect, useState } from "react";
import { FileWarning, ShieldCheck } from "lucide-react";
import { AdminEmptyState, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import {
  getAdminReports,
  resolveAdminReport,
  type ModerationAction,
  type ReportRecord,
  type ReportStatus,
  type ReportTargetType
} from "../../services/report.service";

function actionsFor(report: ReportRecord): ModerationAction[] {
  if (report.target_type === "PRODUCT") return ["NONE", "HIDE_PRODUCT"];
  if (report.target_type === "BUSINESS") return ["NONE", "DISABLE_BUSINESS"];
  return ["NONE", "SUSPEND_USER"];
}

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

export function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [status, setStatus] = useState<"" | ReportStatus>("PENDING");
  const [targetType, setTargetType] = useState<"" | ReportTargetType>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReportRecord | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<Exclude<ReportStatus, "PENDING">>("REVIEWED");
  const [action, setAction] = useState<ModerationAction>("NONE");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminReports({
        status: status || undefined,
        targetType: targetType || undefined
      });
      setReports(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [status, targetType]);

  function choose(report: ReportRecord) {
    setSelected(report);
    setDecisionStatus("REVIEWED");
    setAction("NONE");
    setNote("");
  }

  async function resolve(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;

    setSaving(true);
    setError("");
    try {
      await resolveAdminReport(selected.id, {
        status: decisionStatus,
        action,
        note
      });
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resolve report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <AdminPageHeader
        eyebrow="Admin moderation"
        title="Reports"
        description="Review marketplace reports, dismiss invalid cases, or take supported moderation actions."
        icon={<FileWarning className="size-3.5" />}
      />

      <section className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Status
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ACTION_TAKEN">Action taken</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          Target
          <select className={selectClass} value={targetType} onChange={(e) => setTargetType(e.target.value as typeof targetType)}>
            <option value="">All</option>
            <option value="PRODUCT">Product</option>
            <option value="BUSINESS">Business</option>
            <option value="SELLER">Seller</option>
            <option value="USER">User</option>
          </select>
        </label>
      </section>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-5">
          <AdminEmptyState
            icon={<FileWarning className="size-6" />}
            title="No reports found"
            description="No moderation reports match the current filters."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {reports.map((report) => (
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm" key={report.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-primary">{report.target_type}</span>
                  <h2 className="mt-1 text-lg font-semibold">{report.target_label ?? report.target_type}</h2>
                </div>
                <Badge variant={report.status === "PENDING" ? "warning" : report.status === "ACTION_TAKEN" ? "destructive" : "secondary"}>
                  {report.status.replaceAll("_", " ")}
                </Badge>
              </div>

              <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground">Reason</span>
                <strong className="mt-1 block text-sm">{report.reason.replaceAll("_", " ")}</strong>
                {report.description && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.description}</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <small className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString()}</small>
                <button
                  data-ui="admin-report-review"
                  type="button"
                  onClick={() => choose(report)}
                  className="h-9 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground"
                >
                  Review
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Review: {selected.target_label ?? selected.target_type}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{selected.reason.replaceAll("_", " ")}</p>
            </div>
          </div>

          {selected.description && (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{selected.description}</p>
          )}

          <form className="mt-5 grid gap-4" onSubmit={resolve}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Decision
                <select
                  className={selectClass}
                  value={decisionStatus}
                  onChange={(e) => {
                    const value = e.target.value as Exclude<ReportStatus, "PENDING">;
                    setDecisionStatus(value);
                    if (value !== "ACTION_TAKEN") setAction("NONE");
                  }}
                >
                  <option value="REVIEWED">Reviewed only</option>
                  <option value="DISMISSED">Dismiss report</option>
                  <option value="ACTION_TAKEN">Take moderation action</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Action
                <select
                  className={selectClass}
                  value={action}
                  disabled={decisionStatus !== "ACTION_TAKEN"}
                  onChange={(e) => setAction(e.target.value as ModerationAction)}
                >
                  {actionsFor(selected).map((item) => (
                    <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
              Admin note
              <textarea
                data-ui="admin-report-note"
                value={note}
                maxLength={1500}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-28 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </label>

            <div className="flex gap-2">
              <button
                data-ui="admin-report-save"
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save decision"}
              </button>
              <button
                data-ui="admin-report-cancel"
                type="button"
                onClick={() => setSelected(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
