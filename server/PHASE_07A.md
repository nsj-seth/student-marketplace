# Phase 07A — Seller Business Management

Adds seller-owned business management after admin approval.

## New API routes

- `GET /api/seller/businesses`
- `GET /api/seller/businesses/:id`
- `PATCH /api/seller/businesses/:id`
- `PATCH /api/seller/businesses/:id/availability`

All routes require authentication plus the `SELLER` role. Every query also filters by the authenticated user's `owner_id`.

## Database migration

Run `supabase/migrations/009_seller_business_management.sql` after migrations 001–008.

The migration adds `update_owned_business(...)`, a service-role-only PostgreSQL function that updates business details and categories atomically while re-checking ownership, category validity, fulfilment, and replacement-logo paths.
