import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ImageIcon,
  MapPin,
  Package,
  Phone,
  Power,
  Save,
  Truck
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  getMyBusiness,
  updateMyBusiness,
  updateMyBusinessAvailability,
  type ManagedBusiness
} from "../../services/business.service";
import { getCategories, type Category } from "../../services/category.service";

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
      const { data } = supabase.storage
        .from("business-logos")
        .getPublicUrl(next.logo_path);
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
        const [businessResponse, categoryResponse] = await Promise.all([
          getMyBusiness(id),
          getCategories()
        ]);
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

  const canSave = useMemo(
    () =>
      Boolean(
        business &&
          name.trim().length >= 2 &&
          description.trim().length >= 20 &&
          locationText.trim() &&
          contactPhone.trim().length >= 5 &&
          categoryIds.length >= 1 &&
          categoryIds.length <= 5 &&
          logoPath &&
          (pickupEnabled || sellerDeliveryEnabled)
      ),
    [
      business,
      name,
      description,
      locationText,
      contactPhone,
      categoryIds,
      logoPath,
      pickupEnabled,
      sellerDeliveryEnabled
    ]
  );

  function toggleCategory(categoryId: string) {
    setCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : current.length < 5
          ? [...current, categoryId]
          : current
    );
  }

  async function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
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
      const path =
        user.id +
        "/businesses/" +
        business.id +
        "/logo-" +
        Date.now() +
        "." +
        extension;

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      setLogoPath(path);
      const { data } = supabase.storage
        .from("business-logos")
        .getPublicUrl(path);
      setLogoPreview(data.publicUrl);
      setMessage(
        "New logo uploaded. Save changes to attach it to the business."
      );
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
      const next =
        business.availability_status === "OPEN" ? "UNAVAILABLE" : "OPEN";
      const response = await updateMyBusinessAvailability(business.id, next);

      if (response.data) populate(response.data);
      setMessage(
        next === "OPEN"
          ? "Business is now open."
          : "Business is now marked unavailable."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update availability."
      );
    } finally {
      setAvailabilityBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Building2 className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Business not found</h1>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to="/seller/businesses"
          >
            <ArrowLeft className="size-4" />
            Back to my businesses
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <Building2 className="size-3.5" />
            Seller Hub · Store settings
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.04em]">
            Manage {business.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {business.business_type === "STUDENT_BUSINESS"
              ? "Student Business"
              : "Community Business"}
            {business.university ? " · " + business.university.name : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              business.availability_status === "OPEN"
                ? "success"
                : "secondary"
            }
          >
            {business.availability_status === "OPEN"
              ? "Open"
              : "Unavailable"}
          </Badge>
          <button
            data-ui="business-availability"
            type="button"
            onClick={() => void handleAvailability()}
            disabled={availabilityBusy}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
          >
            <Power className="size-4" />
            {availabilityBusy
              ? "Updating..."
              : business.availability_status === "OPEN"
                ? "Set unavailable"
                : "Set open"}
          </button>
        </div>
      </section>

      {message && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        onSubmit={handleSave}
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Business details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
                Business name
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
                Description
                <textarea
                  data-ui="business-description"
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Location
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={locationText}
                    onChange={(event) => setLocationText(event.target.value)}
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
                    required
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Categories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose between 1 and 5 categories.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-medium"
                >
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
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
                  className="mt-1 size-4 accent-violet-600"
                />
                <span>
                  <strong className="flex items-center gap-2 text-sm">
                    <Package className="size-4" />
                    Customer Pickup
                  </strong>
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
                  className="mt-1 size-4 accent-violet-600"
                />
                <span>
                  <strong className="flex items-center gap-2 text-sm">
                    <Truck className="size-4" />
                    Seller Delivery
                  </strong>
                  <small className="mt-1 block text-xs leading-5 text-muted-foreground">
                    You can arrange delivery with customers.
                  </small>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Social links</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Instagram
                <Input
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Facebook
                <Input
                  value={facebook}
                  onChange={(event) => setFacebook(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                WhatsApp
                <Input
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Website
                <Input
                  type="url"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-[92px] xl:self-start">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-5 text-primary" />
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
                disabled={uploading}
                className="block w-full text-sm"
              />
            </label>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              JPG, PNG or WebP. Maximum file size: 2 MB.
            </p>

            <button
              data-ui="business-save"
              type="submit"
              disabled={!canSave || saving || uploading}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save business changes"}
            </button>

            <div className="mt-5 grid gap-2 border-t border-border pt-5">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
                to={"/seller/businesses/" + business.id + "/products"}
              >
                Manage products
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary"
                to="/seller/businesses"
              >
                <ArrowLeft className="size-4" />
                Back to businesses
              </Link>
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}
