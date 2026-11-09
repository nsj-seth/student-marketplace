# Phase 21 — Deployment Preparation (Frontend)

For the current free launch using Render for both the frontend and API, follow [the Render deployment guide](../docs/RENDER_DEPLOYMENT.md). The root `render.yaml` contains the current service configuration.

The Vercel instructions below are retained as an alternative; use a plan whose terms permit this marketplace.

## Local production build

From `client` in PowerShell:

```powershell
npm install
npm run check
npm run preview
```

`npm run check` validates TypeScript and creates a production Vite build.

## Vercel settings

Import the GitHub repository and use:

- Framework Preset: Vite
- Root Directory: `client`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Set these Vercel environment variables:

- `VITE_API_URL=https://YOUR_API_SERVICE.onrender.com/api`
- `VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=...`

Never add a Supabase secret/service-role key to Vercel frontend variables.

`vercel.json` contains the SPA fallback required so React Router pages still load when a user directly visits or refreshes a nested route.

## Supabase Auth URL configuration

After you know the final Vercel/custom-domain URL, configure Supabase Auth:

- Site URL: `https://YOUR_FRONTEND_DOMAIN`
- Additional redirect: `https://YOUR_FRONTEND_DOMAIN/auth/callback` and `https://YOUR_FRONTEND_DOMAIN/reset-password`
- Optional development redirect: `http://localhost:5173`, `http://localhost:5173/auth/callback`, and `http://localhost:5173/reset-password`

The app uses the browser origin when generating email confirmation and password-reset redirect URLs, so the same auth code works locally and in production.

## Production smoke test

Verify at minimum:

- `/`
- `/login`
- `/products`
- `/businesses`
- `/profile` after login
- `/cart` after login
- `/orders` after login
- `/seller/businesses` as an approved seller
- `/admin` as an admin

Refresh several nested routes directly to confirm Vercel's SPA fallback is working.
