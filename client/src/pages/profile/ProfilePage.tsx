import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getCurrentProfile, updateCurrentProfile, type CurrentProfile } from "../../services/profile.service";

export function ProfilePage() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentProfile().then((response) => {
      if (response.data) { setProfile(response.data); setFullName(response.data.fullName); }
    }).catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const response = await updateCurrentProfile(fullName);
      if (response.data) { setProfile(response.data); setMessage("Profile updated."); }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Update failed.");
    }
  }

  if (loading) return <main className="wide-shell"><div className="account-loading">Loading your account...</div></main>;

  return (
    <main className="wide-shell account-page">
      <section className="account-hero">
        <div className="account-hero__avatar">{(profile?.fullName?.[0] ?? profile?.email?.[0] ?? "U").toUpperCase()}</div>
        <div><span className="eyebrow">My account</span><h1>{profile?.fullName || "Your profile"}</h1><p>Manage your personal details and jump back into your marketplace activity.</p></div>
        <span className={`account-verified ${profile?.emailVerified ? "account-verified--yes" : ""}`}>{profile?.emailVerified ? "Email verified" : "Email not verified"}</span>
      </section>

      <div className="account-layout">
        <aside className="account-menu card">
          <Link className="account-menu__item account-menu__item--active" to="/profile"><span>01</span><div><strong>Profile</strong><small>Personal details</small></div></Link>
          <Link className="account-menu__item" to="/orders"><span>02</span><div><strong>My orders</strong><small>Track purchases</small></div></Link>
          <Link className="account-menu__item" to="/wishlist"><span>03</span><div><strong>Wishlist</strong><small>Saved products</small></div></Link>
          <Link className="account-menu__item" to="/notifications"><span>04</span><div><strong>Notifications</strong><small>Marketplace updates</small></div></Link>
          <Link className="account-menu__item" to="/reports"><span>05</span><div><strong>My reports</strong><small>Moderation requests</small></div></Link>
        </aside>

        <section className="card account-card">
          <div className="account-card__heading"><div><span className="eyebrow">Personal information</span><h2>Profile details</h2></div><span className="account-security-note">Secure account</span></div>
          {error && <p className="message message--error">{error}</p>}
          {profile && (
            <form className="account-form" onSubmit={handleSubmit}>
              <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} required /></label>
              <label>Email address<input value={profile.email} readOnly /><span>Your sign-in email cannot be changed here.</span></label>
              <div className="account-email-status"><span>Email status</span><strong>{profile.emailVerified ? "Verified" : "Pending verification"}</strong></div>
              {message && <p className="message message--success">{message}</p>}
              <div className="account-form__actions"><button type="submit">Save changes</button><Link to="/">Back to marketplace</Link></div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
