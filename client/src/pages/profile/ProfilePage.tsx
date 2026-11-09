import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { AccountNav } from "../../components/account/AccountNav";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getCurrentProfile,
  updateCurrentProfile,
  type CurrentProfile
} from "../../services/profile.service";

export function ProfilePage() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentProfile()
      .then((response) => {
        if (response.data) {
          setProfile(response.data);
          setFullName(response.data.fullName);
        }
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await updateCurrentProfile(fullName);
      if (response.data) {
        setProfile(response.data);
        setMessage("Profile updated.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Update failed.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-6 w-[min(1100px,calc(100%-32px))]">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="h-72 animate-pulse rounded-2xl bg-muted" />
            <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
              {(profile?.fullName?.[0] ?? profile?.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <UserRound className="size-3.5" />
                My account
              </Badge>
              <h1 className="text-2xl font-bold tracking-[-.03em] sm:text-3xl">
                {profile?.fullName || "Your profile"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your personal details and marketplace activity.
              </p>
            </div>
          </div>

          <Badge variant={profile?.emailVerified ? "success" : "warning"} className="w-fit gap-1.5">
            {profile?.emailVerified ? <CheckCircle2 className="size-3.5" /> : <Mail className="size-3.5" />}
            {profile?.emailVerified ? "Email verified" : "Email not verified"}
          </Badge>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">Personal information</span>
                <h2 className="mt-1 text-xl font-semibold">Profile details</h2>
              </div>
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-4 text-success-foreground" />
                Secure account
              </span>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
                {error}
              </div>
            )}

            {profile && (
              <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Full name
                  <Input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={2}
                    required
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Email address
                  <Input value={profile.email ?? ""} readOnly />
                  <span className="font-normal">Your sign-in email cannot be changed here.</span>
                </label>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Email status</span>
                  <strong className="text-sm">{profile.emailVerified ? "Verified" : "Pending verification"}</strong>
                </div>

                {message && (
                  <div className="rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">
                    {message}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    data-ui="profile-save"
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    Save changes
                  </button>
                  <Link className="text-sm font-semibold text-primary-text" to="/">
                    Back to marketplace
                  </Link>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
