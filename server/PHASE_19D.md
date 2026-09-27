# Phase 19D — Marketplace Management + Analytics

Adds the admin dashboard, basic operational analytics, recent-order visibility, top-business summaries, and audited featured business/product controls.

## New routes
- `GET /api/admin/dashboard`
- `GET /api/admin/marketplace`
- `PATCH /api/admin/marketplace/businesses/:id/featured`
- `PATCH /api/admin/marketplace/products/:id/featured`

## Migration
Run `supabase/migrations/027_admin_marketplace_analytics.sql`.
