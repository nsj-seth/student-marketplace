# UI Modernization — Phase 3: Homepage

Phase 3 redesigns the marketplace homepage using the Tailwind + shadcn + Lucide foundation introduced in Phases 1 and 2.

## What changed

- image-led premium hero using real marketplace product imagery
- stronger marketplace value proposition and search experience
- Lucide icons for categories and trust indicators
- redesigned product cards with:
  - larger imagery
  - category and rating metadata
  - featured / out-of-stock badges
  - stronger price hierarchy
  - subtle hover motion
- redesigned business cards with:
  - branded cover treatment
  - real business logos
  - location
  - rating
  - pickup / delivery indicators
  - availability badges
- modern featured-product and featured-store sections
- redesigned seller call-to-action band
- improved empty/loading states
- modern marketplace value cards
- fully responsive grids for phone, tablet, Chromebook and desktop widths

## Data behavior

No backend or marketplace logic was changed.

The homepage still uses:

- `getMarketplaceHome()`
- existing product images from Supabase Storage
- existing business logos from Supabase Storage
- existing category, rating, availability and fulfilment data

The hero intentionally uses marketplace imagery instead of a fixed stock background, so the page stays visually relevant as listings change.

## Verification

After pulling:

```bash
cd ~/projects/student-marketplace/client
npm install
npm run check
npm run dev
```

Review:

- hero at desktop / tablet / phone width
- search for both Products and Businesses
- category navigation
- featured products
- featured stores
- new products
- new businesses
- seller CTA
- image cropping
- long product/business names
- empty image fallbacks
