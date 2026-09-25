import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
    return <main className="page-shell">Loading profile...</main>;
  }

  return (
    <main className="page-shell">
      <section className="card form-card">
        <span className="eyebrow">Protected page</span>
        <h1>My profile</h1>
        {error && <p className="message message--error">{error}</p>}
        {profile && (
          <>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Email verified:</strong> {profile.emailVerified ? "Yes" : "No"}</p>
            <form onSubmit={handleSubmit}>
              <label>
                Full name
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} required />
              </label>
              {message && <p className="message message--success">{message}</p>}
              <button type="submit">Save profile</button>
            </form>
          </>
        )}
        <p><Link to="/">Back home</Link></p>
      </section>
    </main>
  );
}
