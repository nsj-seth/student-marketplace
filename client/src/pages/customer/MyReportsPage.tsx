import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyReports, type ReportRecord } from "../../services/report.service";

export function MyReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMyReports().then((r) => setReports(r.data ?? [])).catch((e) => setError(e instanceof Error ? e.message : "Unable to load reports.")).finally(() => setLoading(false)); }, []);
  return <main className="wide-shell"><section className="card wide-card"><span className="eyebrow">Safety</span><h1>My reports</h1><p>Reports you have submitted to marketplace admins.</p>{loading && <p>Loading...</p>}{error && <p className="message message--error">{error}</p>}{!loading && reports.length === 0 && <p>You have not submitted any reports.</p>}<div className="report-list">{reports.map((report) => <article className="review-card" key={report.id}><div className="review-card__heading"><strong>{report.target_label ?? report.target_type}</strong><span className="status-chip">{report.status.replaceAll("_", " ")}</span></div><p><strong>Reason:</strong> {report.reason.replaceAll("_", " ")}</p>{report.description && <p>{report.description}</p>}{report.admin_note && <p><strong>Admin note:</strong> {report.admin_note}</p>}<small>{new Date(report.created_at).toLocaleString()}</small></article>)}</div><div className="actions"><Link className="button-link button-link--secondary" to="/">Home</Link></div></section></main>;
}
