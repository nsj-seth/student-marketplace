# Student Marketplace Web — Phase 02

This cumulative snapshot contains the Phase 01 frontend plus Supabase authentication and basic profile UI.

## Added in Phase 02

- Registration
- Login/logout
- Email confirmation-compatible signup
- Forgot/reset password
- Auth session context
- Protected routes
- Profile view/edit through the Express API

## Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the same Supabase project used by the API.
3. Keep `VITE_API_URL=http://localhost:5000/api` locally.
4. Run `npm install`.
5. Run `npm run dev`.

Never put a Supabase secret/service-role key in this frontend.
