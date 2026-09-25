# Student Marketplace API — Phase 03

Cumulative backend snapshot through authentication, profiles, roles, and authorization.

## Current capabilities
- Express + TypeScript foundation
- Supabase Auth token verification
- Protected `GET /api/me` and `PATCH /api/me`
- Multi-role model: `CUSTOMER`, `SELLER`, `ADMIN`
- New users automatically receive `CUSTOMER`
- Server-side `requireRole(...)` middleware
- Permission-test routes for customer/seller/admin access

## Migrations
Run migrations in numeric order. For an existing Phase 02 database, run only the new migration:

`supabase/migrations/003_roles_permissions.sql`

The migration also safely adds `profiles.avatar_path` if an older database was missing it.

## Role assignment
There is intentionally no public endpoint that lets a user grant themselves SELLER or ADMIN.
Seller access will later be granted by the seller-approval workflow. ADMIN should be bootstrapped manually for development or by a trusted administrative process.
