# Phase 24B — Demo Marketplace Images

Phase 24B adds realistic visual data to the Phase 24 demo marketplace.

## What it does

- uploads one image for each demo business into the existing `business-logos` bucket
- uploads one primary image for each demo product into the existing `product-images` bucket
- links uploaded business images through `businesses.logo_path`
- creates `product_images` rows for every successfully uploaded product image
- uses category-matched photo pools for Food, Electronics, Fashion, Beauty, Books, Accessories, Services and Other
- keeps the process repeatable by removing earlier demo image metadata and `demo/` storage objects before reseeding
- falls back to the app's normal placeholder if an individual product photo cannot be downloaded

## Prerequisite

Run the relational demo seed first:

```bash
npm run seed:demo
```

## Run

From `server/`:

```bash
npm run seed:demo:images
```

The script uses:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

from the existing server `.env`.

## Production safety

Like the main demo seed, this script refuses to run with:

```
NODE_ENV=production
```

unless:

```
ALLOW_DEMO_SEED=YES
```

is explicitly set.

## Source images

The curated demo pool uses Unsplash-hosted images suitable for marketplace simulation. The script downloads them and uploads copies into the project's existing Supabase Storage buckets so the frontend continues to use the normal storage URL flow.

## Verification

After seeding:

```bash
npm run dev
```

Then check:

- homepage featured/new product cards
- product catalogue
- product detail pages
- business directory
- storefront pages
- wishlist/cart cards
- seller product screens
- admin product/business screens
