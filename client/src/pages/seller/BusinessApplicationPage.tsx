import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { getCategories, type Category } from "../../services/category.service";
import {
  getMySellerApplication,
  saveSellerApplicationDetails,
  submitSellerApplication,
  type SellerApplication
} from "../../services/seller-application.service";
import { getStudentVerification } from "../../services/student-verification.service";

export function BusinessApplicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [studentVerified, setStudentVerified] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [sellerDeliveryEnabled, setSellerDeliveryEnabled] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDraft = application?.status === "DRAFT";

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [appResponse, categoryResponse] = await Promise.all([
          getMySellerApplication(id),
          getCategories()
        ]);
        const app = appResponse.data ?? null;
        setApplication(app);
        setCategories(categoryResponse.data ?? []);

        if (app) {
          setBusinessName(app.business_name ?? "");
          setDescription(app.description ?? "");
          setLocationText(app.location_text ?? "");
          setContactPhone(app.contact_phone ?? "");
          setSelectedCategoryIds(app.category_ids ?? []);
          setPickupEnabled(app.pickup_enabled);
          setSellerDeliveryEnabled(app.seller_delivery_enabled);
          setInstagram(app.social_links?.instagram ?? "");
          setFacebook(app.social_links?.facebook ?? "");
          setWhatsapp(app.social_links?.whatsapp ?? "");
          setWebsite(app.social_links?.website ?? "");
          setLogoPath(app.logo_path);

          if (app.logo_path) {
            const { data } = supabase.storage.from("business-logos").getPublicUrl(app.logo_path);
            setLogoPreview(data.publicUrl);
          }

          if (app.business_type === "STUDENT_BUSINESS") {
            const verification = await getStudentVerification(id);
            setStudentVerified(verification.data?.status === "VERIFIED");
          } else {
            setStudentVerified(true);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load the business application.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  const canSubmit = useMemo(() => {
    return Boolean(
      isDraft &&
      businessName.trim() &&
      description.trim().length >= 20 &&
      locationText.trim() &&
      contactPhone.trim() &&
      selectedCategoryIds.length > 0 &&
      logoPath &&
      (pickupEnabled || sellerDeliveryEnabled) &&
      studentVerified
    );
  }, [isDraft, businessName, description, locationText, contactPhone, selectedCategoryIds, logoPath, pickupEnabled, sellerDeliveryEnabled, studentVerified]);

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !id || !user) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Logo must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be 2 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/${id}/logo-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      if (logoPath?.startsWith(`${user.id}/${id}/`)) {
        await supabase.storage.from("business-logos").remove([logoPath]);
      }

      setLogoPath(path);
      const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
      setLogoPreview(data.publicUrl);
      setMessage("Logo uploaded. Save the application details to keep this selection.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload logo.");
    } finally {
      setUploading(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((idValue) => idValue !== categoryId)
        : current.length < 5
          ? [...current, categoryId]
          : current
    );
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!id) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await saveSellerApplicationDetails(id, {
        businessName,
        description,
        locationText,
        contactPhone,
        categoryIds: selectedCategoryIds,
        pickupEnabled,
        sellerDeliveryEnabled,
        logoPath,
        socialLinks: { instagram, facebook, whatsapp, website }
      });
      if (response.data) setApplication(response.data);
      setMessage("Business application details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save application details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!id) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await submitSellerApplication(id);
      if (response.data) setApplication(response.data);
      setMessage("Application submitted for admin review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="shell"><section className="card"><p>Loading application...</p></section></main>;
  if (!application) return <main className="shell"><section className="card"><h1>Application not found</h1><Link to="/sell">Back to seller registration</Link></section></main>;

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 05C</span>
        <h1>Business application</h1>
        <p>Status: <strong>{application.status}</strong></p>

        {application.business_type === "STUDENT_BUSINESS" && studentVerified === false && (
          <div className="message message--error">
            Student email verification is required before submission. {" "}
            <Link to={`/sell/applications/${application.id}/student-verification`}>Verify now</Link>
          </div>
        )}

        <form className="compact-form" onSubmit={handleSave}>
          <label>
            Business name
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={!isDraft} required />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isDraft} rows={5} required />
          </label>

          <label>
            Location
            <input value={locationText} onChange={(e) => setLocationText(e.target.value)} disabled={!isDraft} placeholder="e.g. KNUST, Ayeduase" required />
          </label>

          <label>
            Contact phone
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={!isDraft} required />
          </label>

          <fieldset disabled={!isDraft}>
            <legend>Categories (choose up to 5)</legend>
            <div className="checkbox-grid">
              {categories.map((category) => (
                <label key={category.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={!isDraft}>
            <legend>Fulfilment</legend>
            <label className="checkbox-row"><input type="checkbox" checked={pickupEnabled} onChange={(e) => setPickupEnabled(e.target.checked)} /> Customer Pickup</label>
            <label className="checkbox-row"><input type="checkbox" checked={sellerDeliveryEnabled} onChange={(e) => setSellerDeliveryEnabled(e.target.checked)} /> Seller Delivery</label>
          </fieldset>

          <label>
            Business logo (JPG, PNG or WebP, max 2 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} disabled={!isDraft || uploading} />
          </label>
          {logoPreview && <img src={logoPreview} alt="Business logo preview" className="logo-preview" />}
          {uploading && <p>Uploading logo...</p>}

          <h2>Optional contact/social links</h2>
          <label>Instagram<input value={instagram} onChange={(e) => setInstagram(e.target.value)} disabled={!isDraft} /></label>
          <label>Facebook<input value={facebook} onChange={(e) => setFacebook(e.target.value)} disabled={!isDraft} /></label>
          <label>WhatsApp<input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} disabled={!isDraft} /></label>
          <label>Website<input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={!isDraft} /></label>

          {isDraft && <button type="submit" disabled={saving || uploading}>{saving ? "Saving..." : "Save details"}</button>}
        </form>

        {isDraft && (
          <div className="actions">
            <button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting || saving || uploading}>
              {submitting ? "Submitting..." : "Submit for admin review"}
            </button>
          </div>
        )}

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}

        <div className="actions">
          <button className="button-link button-link--secondary" type="button" onClick={() => navigate("/sell")}>Back to seller registration</button>
        </div>
      </section>
    </main>
  );
}
