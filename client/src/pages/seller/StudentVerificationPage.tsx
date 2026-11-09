import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  GraduationCap,
  MailCheck,
  Send,
  ShieldCheck
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  getUniversities,
  type University
} from "../../services/university.service";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15";

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
        setError(
          err instanceof Error ? err.message : "Unable to load verification step."
        );
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
      setError(
        err instanceof Error ? err.message : "Unable to request verification code."
      );
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
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-8 w-[min(820px,calc(100%-32px))]">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(720px,calc(100%-32px))] rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <GraduationCap className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Application not found</h1>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/sell">
            <ArrowLeft className="size-4" />
            Back to seller registration
          </Link>
        </section>
      </main>
    );
  }

  if (application.business_type !== "STUDENT_BUSINESS") {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(720px,calc(100%-32px))] rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Verification not required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This application is for a community business.
          </p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/sell">
            <ArrowLeft className="size-4" />
            Back to seller registration
          </Link>
        </section>
      </main>
    );
  }

  const verified = verification?.status === "VERIFIED";

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(900px,calc(100%-32px))]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <GraduationCap className="size-3.5" />
            Seller onboarding · Student verification
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.025em]">Verify your student email</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Confirm that you control a valid student email from the university linked to this application.
          </p>
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

        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {verified ? (
            <div className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success-foreground">
                <BadgeCheck className="size-7" />
              </span>
              <h2 className="mt-4 text-2xl font-bold">Student email verified</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {verification.student_email}
                {verification.university?.name ? " · " + verification.university.name : ""}
              </p>
              <Link
                className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                to={"/sell/applications/" + application.id + "/business-details"}
              >
                Continue to business details
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["1", "Choose university"],
                  ["2", "Receive code"],
                  ["3", "Confirm email"]
                ].map(([step, label]) => (
                  <div key={step} className="rounded-xl border border-border bg-muted/30 p-3">
                    <span className="text-xs font-bold text-primary-text">{step}</span>
                    <strong className="mt-1 block text-sm">{label}</strong>
                  </div>
                ))}
              </div>

              <form className="mt-6 grid gap-4" onSubmit={handleRequest}>
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  University
                  <select
                    className={selectClass}
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

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Student email
                  <div className="relative">
                    <MailCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={studentEmail}
                      onChange={(event) => setStudentEmail(event.target.value)}
                      className="pl-9"
                      placeholder="student@university.edu"
                      required
                    />
                  </div>
                </label>

                <button
                  data-ui="student-verification-request"
                  type="submit"
                  disabled={requesting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50"
                >
                  <Send className="size-4" />
                  {requesting
                    ? "Sending..."
                    : verification
                      ? "Send new code"
                      : "Send verification code"}
                </button>
              </form>

              {developmentCode && (
                <div className="mt-5 rounded-xl border border-warning-border bg-warning-soft p-4">
                  <span className="text-xs font-semibold text-warning-foreground">Development verification code</span>
                  <strong className="mt-1 block text-2xl tracking-[.18em] text-warning-foreground">
                    {developmentCode}
                  </strong>
                  <p className="mt-2 text-xs leading-5 text-warning-foreground">
                    This appears only because an email provider is not configured in development.
                  </p>
                </div>
              )}

              {verification && (
                <form className="mt-5 border-t border-border pt-5" onSubmit={handleConfirm}>
                  <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                    6-digit verification code
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                      className="text-center text-lg font-bold tracking-[.3em]"
                      required
                    />
                  </label>

                  <button
                    data-ui="student-verification-confirm"
                    type="submit"
                    disabled={confirming || code.length !== 6}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50"
                  >
                    <ShieldCheck className="size-4" />
                    {confirming ? "Verifying..." : "Verify email"}
                  </button>
                </form>
              )}
            </>
          )}
        </section>

        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-text" to="/sell">
          <ArrowLeft className="size-4" />
          Back to seller registration
        </Link>
      </div>
    </main>
  );
}
