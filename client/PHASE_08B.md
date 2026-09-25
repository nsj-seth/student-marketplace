# Phase 08B — Product Images

Adds seller-side product image management with Supabase Storage.

- Up to 8 images per product.
- JPG, PNG, and WebP; max 5 MB each.
- Images are uploaded into the seller's own storage folder.
- The Express API validates the expected owner/business/product path before recording metadata.
- Sellers can reorder images, choose a primary image, and remove images.
- Seller product lists now show the primary thumbnail.

Run backend migration `012_product_images.sql` first.
