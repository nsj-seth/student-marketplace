import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCategories, type Category } from "../../services/category.service";
import { getMyBusiness, updateMyBusiness, updateMyBusinessAvailability, type ManagedBusiness } from "../../services/business.service";
import { useAuth } from "../../context/AuthContext";

export function ManageBusinessPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState<ManagedBusiness | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [sellerDeliveryEnabled, setSellerDeliveryEnabled] = useState(false);
  const [logoPath, setLogoPath] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function populate(next: ManagedBusiness) {
    setBusiness(next);
    setName(next.name);
    setDescription(next.description);
    setLocationText(next.location_text);
    setContactPhone(next.contact_phone);
    setCategoryIds(next.category_ids);
    setPickupEnabled(next.pickup_enabled);
    setSellerDeliveryEnabled(next.seller_delivery_enabled);
    setLogoPath(next.logo_path ?? "");
    setInstagram(next.social_links?.instagram ?? "");
    setFacebook(next.social_links?.facebook ?? "");
    setWhatsapp(next.social_links?.whatsapp ?? "");
    setWebsite(next.social_links?.website ?? "");
    if (next.logo_path) {
      const { data } = supabase.storage.from("business-logos").getPublicUrl(next.logo_path);
      setLogoPreview(data.publicUrl);
    } else {
      setLogoPreview(null);
    }
  }

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setError(null);
        const [businessResponse, categoryResponse] = await Promise.all([getMyBusiness(id), getCategories()]);
        if (businessResponse.data) populate(businessResponse.data);
        setCategories(categoryResponse.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load business.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  const canSave = useMemo(() => Boolean(
    business &&
    name.trim().length >= 2 &&
    description.trim().length >= 20 &&
    locationText.trim() &&
    contactPhone.trim().length >= 5 &&
    categoryIds.length >= 1 &&
    categoryIds.length <= 5 &&
    logoPath &&
    (pickupEnabled || sellerDeliveryEnabled)
  ), [business, name, description, locationText, contactPhone, categoryIds, logoPath, pickupEnabled, sellerDeliveryEnabled]);

  function toggleCategory(categoryId: string) {
    setCategoryIds((current) => current.includes(categoryId)
      ? current.filter((value) => value !== categoryId)
      : current.length < 5 ? [...current, categoryId] : current);
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !business || !user) return;

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
    setMessage(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/businesses/${business.id}/logo-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("business-logos").upload(path, file, {
        upsert: false,
        contentType: file.type
      });
      if (uploadError) throw uploadError;

      setLogoPath(path);
      const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
      setLogoPreview(data.publicUrl);
      setMessage("New logo uploaded. Save changes to attach it to the business.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload logo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!business) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await updateMyBusiness(business.id, {
        name,
        description,
        locationText,
        contactPhone,
        categoryIds,
        pickupEnabled,
        sellerDeliveryEnabled,
        logoPath,
        socialLinks: { instagram, facebook, whatsapp, website }
      });
      if (response.data) populate(response.data);
      setMessage("Business details updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update business.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability() {
    if (!business) return;
    setAvailabilityBusy(true);
    setMessage(null);
    setError(null);
    try {
      const next = business.availability_status === "OPEN" ? "UNAVAILABLE" : "OPEN";
      const response = await updateMyBusinessAvailability(business.id, next);
      if (response.data) populate(response.data);
      setMessage(next === "OPEN" ? "Business is now open." : "Business is now marked unavailable.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update availability.");
    } finally {
      setAvailabilityBusy(false);
    }
  }

  if (loading) return <main className="wide-shell"><section className="wide-card card"><p>Loading business...</p></section></main>;
  if (!business) return <main className="wide-shell"><section className="wide-card card"><h1>Business not found</h1>{error && <p className="message message--error">{error}</p>}<Link to="/seller/businesses">Back to my businesses</Link></section></main>;

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 07A</span>
        <h1>Manage {business.name}</h1>
        <p>
          Type: <strong>{business.business_type === "STUDENT_BUSINESS" ? "Student Business" : "Other Business"}</strong>
          {business.university ? ` · ${business.university.name}` : ""}
        </p>
        <p>Platform status: <strong>{business.status}</strong> · Availability: <strong>{business.availability_status}</strong></p>

        <div className="actions">
          <button type="button" className="secondary-button" onClick={() => void handleAvailability()} disabled={availabilityBusy}>
            {availabilityBusy ? "Updating..." : business.availability_status === "OPEN" ? "Set currently unavailable" : "Set open"}
          </button>
        </div>

        <form className="compact-form" onSubmit={handleSave}>
          <label>Business name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Description<textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
          <label>Location<input value={locationText} onChange={(event) => setLocationText(event.target.value)} required /></label>
          <label>Contact phone<input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} required /></label>

          <fieldset>
            <legend>Categories (choose 1–5)</legend>
            <div className="checkbox-grid">
              {categories.map((category) => (
                <label key={category.id} className="checkbox-row">
                  <input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                  {category.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Fulfilment</legend>
            <label className="checkbox-row"><input type="checkbox" checked={pickupEnabled} onChange={(event) => setPickupEnabled(event.target.checked)} /> Customer Pickup</label>
            <label className="checkbox-row"><input type="checkbox" checked={sellerDeliveryEnabled} onChange={(event) => setSellerDeliveryEnabled(event.target.checked)} /> Seller Delivery</label>
          </fieldset>

          <label>Business logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} disabled={uploading} /></label>
          {logoPreview && <img src={logoPreview} alt="Business logo preview" className="logo-preview" />}
          {uploading && <p>Uploading logo...</p>}

          <h2>Optional contact/social links</h2>
          <label>Instagram<input value={instagram} onChange={(event) => setInstagram(event.target.value)} /></label>
          <label>Facebook<input value={facebook} onChange={(event) => setFacebook(event.target.value)} /></label>
          <label>WhatsApp<input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} /></label>
          <label>Website<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>

          <button type="submit" disabled={!canSave || saving || uploading}>{saving ? "Saving..." : "Save business changes"}</button>
        </form>

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}

        <div className="actions">
          <Link className="button-link button-link--secondary" to="/seller/businesses">Back to my businesses</Link>
          <Link className="button-link button-link--secondary" to="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
