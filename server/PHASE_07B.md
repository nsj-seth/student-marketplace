# Phase 07B — Public Business Storefronts

Adds public business discovery and storefront endpoints.

## Endpoints

- `GET /api/businesses`
- `GET /api/businesses/:slug`

Optional list filters: `search`, `category`, `university`, `businessType`, `availability`.

Only `ACTIVE` businesses are returned. Public responses deliberately omit owner IDs, source application IDs, moderation state, and other internal application data.

Run migration `010_public_business_storefronts.sql` after migration 009.
