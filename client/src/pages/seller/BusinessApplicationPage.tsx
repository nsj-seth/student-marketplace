import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ImageIcon,
  MapPin,
  Phone,
  Save,
  Send,
  Truck
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
            const { data } = supabase.storage
              .from("business-logos")
              .getPublicUrl(app.logo_path);
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
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the business application."
        );
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
  }, [
    isDraft,
    businessName,
    description,
    locationText,
    contactPhone,
    selectedCategoryIds,
    logoPath,
    pickupEnabled,
    sellerDeliveryEnabled,
    studentVerified
  ]);

  const readiness = useMemo(
    () => [
      { label: "Business name", ready: Boolean(businessName.trim()) },
      { label: "Description", ready: description.trim().length >= 20 },
      { label: "Location & phone", ready: Boolean(locationText.trim() && contactPhone.trim()) },
      { label: "Category", ready: selectedCategoryIds.length > 0 },
      { label: "Fulfilment", ready: pickupEnabled || sellerDeliveryEnabled },
      { label: "Business logo", ready: Boolean(logoPath) },
      { label: "Verification", ready: Boolean(studentVerified) }
    ],
    [
      businessName,
      description,
      locationText,
      contactPhone,
      selectedCategoryIds,
      pickupEnabled,
      sellerDeliveryEnabled,
      logoPath,
      studentVerified
    ]
  );

  async function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
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
      const path =
        user.id + "/" + id + "/logo-" + Date.now() + "." + extension;

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      if (logoPath?.startsWith(user.id + "/" + id + "/")) {
        await supabase.storage.from("business-logos").remove([logoPath]);
      }

      setLogoPath(path);

      const { data } = supabase.storage
        .from("business-logos")
        .getPublicUrl(path);
      setLogoPreview(data.publicUrl);

      setMessage(
        "Logo uploaded. Save the application details to keep this selection."
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save application details."
      );
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
      setError(
        err instanceof Error ? err.message : "Unable to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <div className="mx-auto mt-8 w-[min(1080px,calc(100%-32px))]">
          <div className="h-[520px] animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <section className="mx-auto mt-8 w-[min(720px,calc(100%-32px))] rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Building2 className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Application not found</h1>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text"
            to="/sell"
          >
            <ArrowLeft className="size-4" />
            Back to seller registration
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1080px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Building2 className="size-3.5" />
              Seller onboarding · Business details
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.025em]">
              Business application
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add the information customers will see on your storefront, then submit it for admin review.
            </p>
          </div>

          <Badge variant={application.status === "DRAFT" ? "secondary" : "warning"}>
            {application.status}
          </Badge>
        </section>

        {application.business_type === "STUDENT_BUSINESS" &&
          studentVerified === false && (
            <div className="mt-5 flex gap-3 rounded-xl border border-danger-border bg-danger-soft p-4">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-danger-foreground" />
              <div>
                <strong className="text-sm text-danger-foreground">
                  Student verification required
                </strong>
                <p className="mt-1 text-sm text-danger-foreground">
                  Verify your student email before submitting this application.
                </p>
                <Link
                  className="mt-2 inline-flex text-sm font-semibold text-danger-foreground underline"
                  to={
                    "/sell/applications/" +
                    application.id +
                    "/student-verification"
                  }
                >
                  Verify now
                </Link>
              </div>
            </div>
          )}

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

        <form
          className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
          onSubmit={handleSave}
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Business identity</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Business name
                  <Input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    disabled={!isDraft}
                    required
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Description
                  <textarea
                    data-ui="application-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={!isDraft}
                    rows={5}
                    required
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15 disabled:saturate-50"
                  />
                  <span className="font-normal">
                    At least 20 characters.
                  </span>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Location
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={locationText}
                      onChange={(event) => setLocationText(event.target.value)}
                      disabled={!isDraft}
                      placeholder="e.g. KNUST, Ayeduase"
                      required
                    />
                  </div>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Contact phone
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                      disabled={!isDraft}
                      required
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose up to 5 categories that best describe your business.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      disabled={!isDraft}
                      className="size-4 accent-violet-600"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Fulfilment</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                  <input
                    type="checkbox"
                    checked={pickupEnabled}
                    onChange={(event) => setPickupEnabled(event.target.checked)}
                    disabled={!isDraft}
                    className="mt-1 size-4 accent-violet-600"
                  />
                  <span>
                    <strong className="block text-sm">Customer Pickup</strong>
                    <small className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Customers can collect orders directly from you.
                    </small>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                  <input
                    type="checkbox"
                    checked={sellerDeliveryEnabled}
                    onChange={(event) =>
                      setSellerDeliveryEnabled(event.target.checked)
                    }
                    disabled={!isDraft}
                    className="mt-1 size-4 accent-violet-600"
                  />
                  <span>
                    <strong className="flex items-center gap-1.5 text-sm">
                      <Truck className="size-4" />
                      Seller Delivery
                    </strong>
                    <small className="mt-1 block text-xs leading-5 text-muted-foreground">
                      You can arrange delivery directly with customers.
                    </small>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Social & contact links</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Instagram
                  <Input
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    disabled={!isDraft}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Facebook
                  <Input
                    value={facebook}
                    onChange={(event) => setFacebook(event.target.value)}
                    disabled={!isDraft}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  WhatsApp
                  <Input
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    disabled={!isDraft}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                  Website
                  <Input
                    type="url"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    disabled={!isDraft}
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-[92px] lg:self-start">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-5 text-primary-text" />
                <h2 className="text-lg font-semibold">Business logo</h2>
              </div>

              <div className="mt-4 grid aspect-square place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Business logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>

              <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Upload logo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  disabled={!isDraft || uploading}
                  className="block w-full text-sm"
                />
              </label>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                JPG, PNG or WebP. Maximum 2 MB.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-primary-text">
                Submission readiness
              </span>

              <div className="mt-4 space-y-2">
                {readiness.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <CheckCircle2
                      className={
                        "size-4 " +
                        (item.ready
                          ? "text-success-foreground"
                          : "text-muted-foreground/30")
                      }
                    />
                  </div>
                ))}
              </div>

              {isDraft && (
                <>
                  <button
                    data-ui="application-save"
                    type="submit"
                    disabled={saving || uploading}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:saturate-50"
                  >
                    <Save className="size-4" />
                    {saving ? "Saving..." : "Save details"}
                  </button>

                  <button
                    data-ui="application-submit"
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={
                      !canSubmit || submitting || saving || uploading
                    }
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:saturate-50"
                  >
                    <Send className="size-4" />
                    {submitting
                      ? "Submitting..."
                      : "Submit for admin review"}
                  </button>
                </>
              )}
            </section>
          </aside>
        </form>

        <button
          data-ui="application-back"
          type="button"
          onClick={() => navigate("/sell")}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-text"
        >
          <ArrowLeft className="size-4" />
          Back to seller registration
        </button>
      </div>
    </main>
  );
}
