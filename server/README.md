# Student Marketplace API — Phase 02

This cumulative snapshot contains the Phase 01 Express foundation plus authentication-aware profile endpoints.

## Added in Phase 02

- Supabase Auth token verification middleware
- `profiles` table migration + automatic profile creation trigger
- `GET /api/me`
- `PATCH /api/me`
- Basic profile RLS policies

## Setup

1. Create a Supabase project.
2. Run migrations in order:
   - `supabase/migrations/001_database_foundation.sql`
   - `supabase/migrations/002_auth_profiles.sql`
3. Copy `.env.example` to `.env`.
4. Put your real Supabase URL, publishable/anon key and server secret/service-role key in `.env`.
5. Run `npm install`.
6. Run `npm run dev`.

## Endpoints

- `GET /api/health` — public
- `GET /api/me` — authenticated
- `PATCH /api/me` — authenticated

Authenticated routes expect:

`Authorization: Bearer <supabase-access-token>`

Never put the Supabase secret/service-role key in the frontend.
