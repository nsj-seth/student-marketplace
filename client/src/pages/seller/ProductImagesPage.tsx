import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImageIcon,
  Star,
  Trash2,
  Upload
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  attachSellerProductImage,
  getSellerProduct,
  removeSellerProductImage,
  reorderSellerProductImages,
  setSellerProductPrimaryImage,
  type ManagedProduct,
  type ProductImage
} from "../../services/product.service";

function imageUrl(path: string) {
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function ProductImagesPage() {
  const { businessId, productId } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<ManagedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!businessId || !productId) return;

    try {
      setError(null);
      const response = await getSellerProduct(businessId, productId);
      setProduct(response.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load product images."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [businessId, productId]);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !businessId || !productId || !user || !product) return;

    if (product.images.length >= 8) {
      setError("A product can have at most 8 images.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Product images must be JPG, PNG, or WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Product images must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    let uploadedPath: string | null = null;

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const uniqueName = crypto.randomUUID() + "." + extension;
      const path =
        user.id +
        "/businesses/" +
        businessId +
        "/products/" +
        productId +
        "/" +
        uniqueName;

      uploadedPath = path;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const response = await attachSellerProductImage(
        businessId,
        productId,
        path,
        product.name
      );

      setProduct(response.data ?? product);
      setMessage("Product image added.");
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("product-images").remove([uploadedPath]);
      }
      setError(
        err instanceof Error ? err.message : "Unable to upload product image."
      );
    } finally {
      setUploading(false);
    }
  }

  async function makePrimary(image: ProductImage) {
    if (!businessId || !productId) return;

    setBusyId(image.id);
    setError(null);
    setMessage(null);

    try {
      const response = await setSellerProductPrimaryImage(
        businessId,
        productId,
        image.id
      );
      setProduct(response.data ?? product);
      setMessage("Primary image updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to set primary image."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(image: ProductImage) {
    if (!businessId || !productId) return;
    if (!window.confirm("Remove this product image?")) return;

    setBusyId(image.id);
    setError(null);
    setMessage(null);

    try {
      const response = await removeSellerProductImage(
        businessId,
        productId,
        image.id
      );
      setProduct(response.data ?? product);
      setMessage("Product image removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove image.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!businessId || !productId || !product) return;

    const target = index + direction;
    if (target < 0 || target >= product.images.length) return;

    const next = [...product.images];
    [next[index], next[target]] = [next[target]!, next[index]!];

    setBusyId(product.images[index]!.id);
    setError(null);
    setMessage(null);

    try {
      const response = await reorderSellerProductImages(
        businessId,
        productId,
        next.map((image) => image.id)
      );
      setProduct(response.data ?? product);
      setMessage("Image order updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reorder images."
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background p-5 sm:p-6">
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <ImageIcon className="mx-auto size-8 text-primary-text" />
          <h1 className="mt-4 text-2xl font-bold">Product not found</h1>
          {error && <p className="mt-2 text-sm text-danger-foreground">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-6">
      <section className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <ImageIcon className="size-3.5" />
            Seller Hub · Product media
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-.04em]">
            {product.name} images
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add up to 8 images, choose the primary image and control gallery order.
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text"
          to={"/seller/businesses/" + businessId + "/products"}
        >
          <ArrowLeft className="size-4" />
          Back to products
        </Link>
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

      <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong className="text-sm">
            {product.images.length}/8 images
          </strong>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG or WebP. Maximum file size: 5 MB.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Upload className="size-4" />
          {uploading ? "Uploading..." : "Add image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={upload}
            disabled={uploading || product.images.length >= 8}
            className="hidden"
          />
        </label>
      </section>

      {product.images.length === 0 ? (
        <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
          <ImageIcon className="size-7 text-primary-text" />
          <h2 className="mt-4 text-xl font-semibold">No images yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add product photography to improve how this listing appears to customers.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {product.images.map((image, index) => (
            <article
              key={image.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={imageUrl(image.storage_path)}
                  alt={image.alt_text ?? product.name}
                  className="h-full w-full object-cover"
                />
                {image.is_primary && (
                  <Badge className="absolute left-3 top-3 gap-1.5">
                    <Star className="size-3.5 fill-current" />
                    Primary
                  </Badge>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">
                    {image.is_primary ? "Primary image" : "Image " + (index + 1)}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    Position {index + 1}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    data-ui="image-move-up"
                    type="button"
                    disabled={index === 0 || busyId === image.id}
                    onClick={() => void move(index, -1)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold disabled:saturate-50"
                  >
                    <ArrowUp className="size-3.5" />
                    Move up
                  </button>

                  <button
                    data-ui="image-move-down"
                    type="button"
                    disabled={
                      index === product.images.length - 1 ||
                      busyId === image.id
                    }
                    onClick={() => void move(index, 1)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold disabled:saturate-50"
                  >
                    <ArrowDown className="size-3.5" />
                    Move down
                  </button>

                  {!image.is_primary && (
                    <button
                      data-ui="image-primary"
                      type="button"
                      disabled={busyId === image.id}
                      onClick={() => void makePrimary(image)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold disabled:saturate-50"
                    >
                      <Star className="size-3.5" />
                      Make primary
                    </button>
                  )}

                  <button
                    data-ui="image-remove"
                    type="button"
                    disabled={busyId === image.id}
                    onClick={() => void remove(image)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-danger-border bg-danger-soft px-3 text-xs font-semibold text-danger-foreground disabled:saturate-50"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text"
          to={
            "/seller/businesses/" +
            businessId +
            "/products/" +
            productId
          }
        >
          Edit product details
        </Link>
      </div>
    </main>
  );
}
