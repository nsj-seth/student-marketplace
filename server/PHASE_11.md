# Phase 11 — Wishlist

Adds authenticated wishlist management.

## API
- GET `/api/wishlist`
- POST `/api/wishlist`
- DELETE `/api/wishlist/:productId`
- GET `/api/wishlist/:productId/status`

## Rules
- Wishlist ownership comes from the authenticated user, never from request input.
- `(user_id, product_id)` is unique, preventing duplicate wishlist rows.
- Only products that are still publicly visible through the marketplace are returned in wishlist listings.
- Adding a non-public product is rejected.
