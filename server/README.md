# Student Marketplace API

Cumulative backend through **Phase 04 — Universities & Categories**.

## Current capabilities

- Express + TypeScript API foundation
- Supabase Auth token verification
- Profiles
- CUSTOMER / SELLER / ADMIN role model and server-side authorization
- Public active university/category endpoints
- Admin university/category management endpoints
- Supabase SQL migrations through `004_universities_categories.sql`

## Run locally

1. Keep your existing `.env` file when replacing this folder.
2. Run `npm install`.
3. Run migration `004_universities_categories.sql` in Supabase SQL Editor if 001–003 are already applied.
4. Start with `npm run dev`.

## Phase 04 endpoints

- `GET /api/universities`
- `GET /api/categories`
- `GET /api/admin/universities` — ADMIN
- `POST /api/admin/universities` — ADMIN
- `PATCH /api/admin/universities/:id` — ADMIN
- `DELETE /api/admin/universities/:id` — ADMIN (soft-disables)
- `GET /api/admin/categories` — ADMIN
- `POST /api/admin/categories` — ADMIN
- `PATCH /api/admin/categories/:id` — ADMIN
- `DELETE /api/admin/categories/:id` — ADMIN (soft-disables)
