# Phase 20 — Testing + Security Hardening

This checkpoint hardens the API without changing marketplace behavior.

## Added
- Request IDs on API responses for debugging/support.
- Production environment validation for Supabase and verification secrets.
- Explicit CORS allow-list with optional `FRONTEND_URLS`.
- Global and write-specific rate limiting.
- Strict JSON request handling and malformed JSON responses.
- URL length and media-type checks.
- Safer security headers and proxy configuration.
- Automated tests for cart, checkout, product, image, and order-status validation.
- `npm run check` to typecheck, test, and build the server.

## Manual security checklist
1. CUSTOMER cannot access `/api/admin/*` or seller-only routes.
2. SELLER cannot access another seller's business/product/order IDs.
3. Suspended users receive 403 on authenticated API calls.
4. Client-supplied prices never affect checkout totals.
5. Checkout rejects insufficient stock and duplicate/replayed converted carts.
6. Reviews cannot be created for incomplete or someone else's purchases.
7. Product/business moderation removes listings publicly without deleting history.
8. `.env` files and service-role/secret keys are absent from Git history.
9. Wrong browser origin is rejected in production.
10. Malformed JSON and non-JSON write bodies fail safely.

Run:

```bash
npm run check
```
