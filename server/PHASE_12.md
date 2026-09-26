# Phase 12 — Cart

Adds one active cart per authenticated user, cart items, quantity management, duplicate-item merging, stock and business-availability checks, per-business grouping, and cart totals.

Run migration `017_cart.sql` after the previous migrations.

Routes:
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `DELETE /api/cart`

Stock is not reserved at cart time. Checkout will revalidate and decrement stock atomically in the later checkout phase.
