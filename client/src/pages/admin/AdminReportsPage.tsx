import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminReports, resolveAdminReport, type ModerationAction, type ReportRecord, type ReportStatus, type ReportTargetType } from "../../services/report.service";

function actionsFor(report: ReportRecord): ModerationAction[] {
  if (report.target_type === "PRODUCT") return ["NONE", "HIDE_PRODUCT"];
  if (report.target_type === "BUSINESS") return ["NONE", "DISABLE_BUSINESS"];
  return ["NONE", "SUSPEND_USER"];
}

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
    setLoading(true); setError("");
    try { const r = await getAdminReports({ status: status || undefined, targetType: targetType || undefined }); setReports(r.data ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load reports."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [status, targetType]);

  function choose(report: ReportRecord) {
    setSelected(report); setDecisionStatus("REVIEWED"); setAction("NONE"); setNote("");
  }

  async function resolve(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setError("");
    try { await resolveAdminReport(selected.id, { status: decisionStatus, action, note }); setSelected(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to resolve report."); }
    finally { setSaving(false); }
  }

  return <main className="wide-shell admin-management-page"><section className="card wide-card"><span className="eyebrow">Admin moderation</span><h1>Reports</h1><div className="seller-order-filters"><label>Status<select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="">All</option><option value="PENDING">Pending</option><option value="REVIEWED">Reviewed</option><option value="DISMISSED">Dismissed</option><option value="ACTION_TAKEN">Action taken</option></select></label><label>Target<select value={targetType} onChange={(e) => setTargetType(e.target.value as typeof targetType)}><option value="">All</option><option value="PRODUCT">Product</option><option value="BUSINESS">Business</option><option value="SELLER">Seller</option><option value="USER">User</option></select></label></div>{error && <p className="message message--error">{error}</p>}{loading ? <p>Loading reports...</p> : reports.length === 0 ? <p>No reports match these filters.</p> : <div className="report-list">{reports.map((report) => <article className="review-card" key={report.id}><div className="review-card__heading"><strong>{report.target_label ?? report.target_type}</strong><span className="status-chip">{report.status.replaceAll("_", " ")}</span></div><p><strong>{report.target_type}</strong> • {report.reason.replaceAll("_", " ")}</p>{report.description && <p>{report.description}</p>}<small>{new Date(report.created_at).toLocaleString()}</small><div className="actions"><button type="button" onClick={() => choose(report)}>Review</button></div></article>)}</div>}
      {selected && <section className="moderation-panel"><h2>Review: {selected.target_label}</h2><p><strong>Reason:</strong> {selected.reason.replaceAll("_", " ")}</p>{selected.description && <p>{selected.description}</p>}<form className="report-form" onSubmit={resolve}><label>Decision<select value={decisionStatus} onChange={(e) => { const v=e.target.value as Exclude<ReportStatus,"PENDING">; setDecisionStatus(v); if(v!=="ACTION_TAKEN") setAction("NONE"); }}><option value="REVIEWED">Reviewed only</option><option value="DISMISSED">Dismiss report</option><option value="ACTION_TAKEN">Take moderation action</option></select></label><label>Action<select value={action} disabled={decisionStatus !== "ACTION_TAKEN"} onChange={(e) => setAction(e.target.value as ModerationAction)}>{actionsFor(selected).map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label>Admin note<textarea value={note} maxLength={1500} onChange={(e) => setNote(e.target.value)} /></label><div className="actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save decision"}</button><button type="button" className="secondary-button" onClick={() => setSelected(null)}>Cancel</button></div></form></section>}
      <div className="actions"><Link className="button-link button-link--secondary" to="/">Home</Link></div></section></main>;
}
