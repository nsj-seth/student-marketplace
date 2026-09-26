import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createReport, type ReportReason, type ReportTargetType } from "../../services/report.service";

export function ReportForm({ targetType, targetId, label }: { targetType: ReportTargetType; targetId: string; label: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("MISLEADING");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      await createReport({ targetType, targetId, reason, description });
      setMessage("Report submitted for admin review.");
      setDescription("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit report.");
    } finally { setSaving(false); }
  }

  if (!user) return <p className="muted-text"><Link to="/login">Login</Link> to report {label.toLowerCase()}.</p>;

  return (
    <div className="report-box">
      <button type="button" className="secondary-button" onClick={() => setOpen((value) => !value)}>{open ? "Cancel report" : `Report ${label}`}</button>
      {message && <p className="message message--success">{message}</p>}
      {error && <p className="message message--error">{error}</p>}
      {open && <form className="report-form" onSubmit={submit}>
        <label>Reason
          <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            <option value="MISLEADING">Misleading information</option>
            <option value="FRAUD">Fraud / scam concern</option>
            <option value="INAPPROPRIATE">Inappropriate content</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="SPAM">Spam</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>Details (optional)
          <textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell the admin what happened." />
        </label>
        <button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit report"}</button>
      </form>}
    </div>
  );
}
