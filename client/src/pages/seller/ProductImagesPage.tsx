import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
      setError(err instanceof Error ? err.message : "Unable to load product images.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [businessId, productId]);

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

    setUploading(true); setError(null); setMessage(null);
    let uploadedPath: string | null = null;
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const uniqueName = `${crypto.randomUUID()}.${extension}`;
      const path = `${user.id}/businesses/${businessId}/products/${productId}/${uniqueName}`;
      uploadedPath = path;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
        upsert: false,
        contentType: file.type
      });
      if (uploadError) throw uploadError;

      const response = await attachSellerProductImage(businessId, productId, path, product.name);
      setProduct(response.data ?? product);
      setMessage("Product image added.");
    } catch (err) {
      if (uploadedPath) await supabase.storage.from("product-images").remove([uploadedPath]);
      setError(err instanceof Error ? err.message : "Unable to upload product image.");
    } finally {
      setUploading(false);
    }
  }

  async function makePrimary(image: ProductImage) {
    if (!businessId || !productId) return;
    setBusyId(image.id); setError(null); setMessage(null);
    try {
      const response = await setSellerProductPrimaryImage(businessId, productId, image.id);
      setProduct(response.data ?? product);
      setMessage("Primary image updated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to set primary image."); }
    finally { setBusyId(null); }
  }

  async function remove(image: ProductImage) {
    if (!businessId || !productId) return;
    if (!window.confirm("Remove this product image?")) return;
    setBusyId(image.id); setError(null); setMessage(null);
    try {
      const response = await removeSellerProductImage(businessId, productId, image.id);
      setProduct(response.data ?? product);
      setMessage("Product image removed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to remove image."); }
    finally { setBusyId(null); }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!businessId || !productId || !product) return;
    const target = index + direction;
    if (target < 0 || target >= product.images.length) return;
    const next = [...product.images];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setBusyId(product.images[index]!.id); setError(null); setMessage(null);
    try {
      const response = await reorderSellerProductImages(businessId, productId, next.map((image) => image.id));
      setProduct(response.data ?? product);
      setMessage("Image order updated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to reorder images."); }
    finally { setBusyId(null); }
  }

  if (loading) return <main className="wide-shell"><section className="wide-card card"><p>Loading images...</p></section></main>;
  if (!product) return <main className="wide-shell"><section className="wide-card card"><h1>Product not found</h1>{error && <p className="message message--error">{error}</p>}</section></main>;

  return (
    <main className="wide-shell">
      <section className="wide-card card">
        <span className="eyebrow">Phase 08B</span>
        <h1>{product.name} images</h1>
        <p>Add up to 8 images. The primary image will be used as the product's main marketplace image.</p>

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}

        <label>
          Add product image (JPG, PNG or WebP, max 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading || product.images.length >= 8} />
        </label>
        {uploading && <p>Uploading image...</p>}
        <p>{product.images.length}/8 images</p>

        {product.images.length === 0 ? (
          <div className="info-box"><p>No images yet.</p></div>
        ) : (
          <div className="product-image-admin-grid">
            {product.images.map((image, index) => (
              <article key={image.id} className="product-image-admin-card">
                <img src={imageUrl(image.storage_path)} alt={image.alt_text ?? product.name} className="product-image-preview" />
                <p><strong>{image.is_primary ? "Primary image" : `Image ${index + 1}`}</strong></p>
                <div className="actions">
                  <button type="button" className="secondary-button" disabled={index === 0 || busyId === image.id} onClick={() => void move(index, -1)}>Move up</button>
                  <button type="button" className="secondary-button" disabled={index === product.images.length - 1 || busyId === image.id} onClick={() => void move(index, 1)}>Move down</button>
                  {!image.is_primary && <button type="button" className="secondary-button" disabled={busyId === image.id} onClick={() => void makePrimary(image)}>Make primary</button>}
                  <button type="button" className="danger-button" disabled={busyId === image.id} onClick={() => void remove(image)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="actions">
          <Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}/products`}>Back to products</Link>
          <Link className="button-link button-link--secondary" to={`/seller/businesses/${businessId}/products/${productId}`}>Edit product details</Link>
        </div>
      </section>
    </main>
  );
}
