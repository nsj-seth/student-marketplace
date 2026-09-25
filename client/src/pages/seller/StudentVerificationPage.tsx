import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMySellerApplication,
  type SellerApplication
} from "../../services/seller-application.service";
import {
  confirmStudentVerification,
  getStudentVerification,
  requestStudentVerification,
  type StudentVerification
} from "../../services/student-verification.service";
import { getUniversities, type University } from "../../services/university.service";

export function StudentVerificationPage() {
  const { id } = useParams();
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [verification, setVerification] = useState<StudentVerification | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [code, setCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [applicationResponse, universitiesResponse, verificationResponse] =
          await Promise.all([
            getMySellerApplication(id),
            getUniversities(),
            getStudentVerification(id)
          ]);

        const app = applicationResponse.data ?? null;
        const existing = verificationResponse.data ?? null;
        setApplication(app);
        setUniversities(universitiesResponse.data ?? []);
        setVerification(existing);
        if (existing) {
          setUniversityId(existing.university_id);
          setStudentEmail(existing.student_email);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load verification step.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!id) return;
    setRequesting(true);
    setMessage(null);
    setError(null);
    setDevelopmentCode(null);

    try {
      const response = await requestStudentVerification({
        sellerApplicationId: id,
        universityId,
        studentEmail
      });
      const result = response.data;
      if (result) {
        setVerification(result.verification);
        setDevelopmentCode(result.developmentCode ?? null);
        setMessage(
          result.delivery === "EMAIL"
            ? "Verification code sent to your student email."
            : result.delivery === "DEVELOPMENT"
              ? "Development verification code generated."
              : "This student email is already verified."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request verification code.");
    } finally {
      setRequesting(false);
    }
  }

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (!id) return;
    setConfirming(true);
    setMessage(null);
    setError(null);

    try {
      const response = await confirmStudentVerification({
        sellerApplicationId: id,
        code
      });
      if (response.data) {
        setVerification(response.data);
        setCode("");
        setDevelopmentCode(null);
        setMessage("Student email verified successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify code.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return <main className="shell"><section className="card"><p>Loading student verification...</p></section></main>;
  }

  if (!application) {
    return <main className="shell"><section className="card"><h1>Application not found</h1><Link to="/sell">Back to seller registration</Link></section></main>;
  }

  if (application.business_type !== "STUDENT_BUSINESS") {
    return <main className="shell"><section className="card"><h1>Student verification not required</h1><p>This application is for an Other Business.</p><Link to="/sell">Back to seller registration</Link></section></main>;
  }

  const verified = verification?.status === "VERIFIED";

  return (
    <main className="shell">
      <section className="card form-card">
        <span className="eyebrow">Phase 05B</span>
        <h1>Verify student email</h1>
        <p>
          Select your university and verify that you control the student email you provide.
        </p>

        {verified ? (
          <div className="message message--success">
            Verified: {verification.student_email}
            {verification.university?.name ? ` — ${verification.university.name}` : ""}
          </div>
        ) : (
          <>
            <form onSubmit={handleRequest}>
              <label>
                University
                <select
                  value={universityId}
                  onChange={(event) => setUniversityId(event.target.value)}
                  required
                >
                  <option value="">Select university</option>
                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Student email
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(event) => setStudentEmail(event.target.value)}
                  placeholder="student@university.edu"
                  required
                />
              </label>

              <button type="submit" disabled={requesting}>
                {requesting ? "Sending..." : verification ? "Send new code" : "Send verification code"}
              </button>
            </form>

            {developmentCode && (
              <div className="info-box">
                <p><strong>Development code:</strong> {developmentCode}</p>
                <p>This is shown only because an email provider is not configured in development.</p>
              </div>
            )}

            {verification && (
              <form onSubmit={handleConfirm}>
                <label>
                  6-digit verification code
                  <input
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    required
                  />
                </label>
                <button type="submit" disabled={confirming || code.length !== 6}>
                  {confirming ? "Verifying..." : "Verify email"}
                </button>
              </form>
            )}
          </>
        )}

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/sell">
            Back to seller registration
          </Link>
        </div>
      </section>
    </main>
  );
}
