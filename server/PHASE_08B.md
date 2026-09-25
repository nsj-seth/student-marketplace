# Phase 08B — Product Images

Adds multiple product images backed by Supabase Storage.

## Main rules
- Up to 8 images per product.
- JPG, PNG, and WebP only; bucket limit is 5 MB per file.
- Seller uploads to `product-images` under their own user folder.
- Express validates that registered paths belong to the authenticated owner, business, and product.
- Images can be reordered, removed, and one image is designated primary.
- Removing a primary image promotes the next image automatically.
- Seller product responses now include ordered `images` metadata.

Run migration `012_product_images.sql` before testing this phase.
