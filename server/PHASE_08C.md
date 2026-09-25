# Phase 08C — Public Product Listing + Details

Adds public product discovery endpoints:

- `GET /api/products`
- `GET /api/products/:id`

Only `ACTIVE` and `OUT_OF_STOCK` products from `ACTIVE` businesses are exposed. Seller-only, hidden, inactive, removed, ownership, and moderation fields remain private.

Run migration `013_public_products.sql` after 012.
