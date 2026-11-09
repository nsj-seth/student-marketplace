# First online launch: Render + existing Supabase

The repository's `render.yaml` defines two services. It does not create another database, migrate existing data, seed test accounts, buy a domain, or upgrade a hosting plan.

| Component | Render service | Source root | Output / start |
| --- | --- | --- | --- |
| React/Vite frontend | Free static site `student-marketplace-web` | `client` | `dist`, SPA fallback to `/index.html` |
| Express API | Free Node web service `student-marketplace-api` | `server` | `npm start`, health `/api/health` |
| Database/Auth/Storage | Existing Supabase `student-marketplace` | Unchanged | Existing project |

Node is pinned to 24.22.1. Both service builds run `npm ci --include=dev && npm run check`, including their tests and production builds. Render supplies `PORT` to the API; the app already uses it.

## Launch order

1. Connect the repository to Render and create the API as a **Free** Node web service using the server settings above. Do not choose a paid service or a Render database.
2. Configure its server environment (table below). Generate/store `VERIFICATION_CODE_SECRET` in Render. For the initial `FRONTEND_URL`, use the exact static-site origin once Render assigns it. The API can start before the frontend, but browsers will remain blocked by CORS until the correct origin is set.
3. Confirm the API's actual Render URL returns HTTP 200 at `/api/health`.
4. Create the free static site using the client settings, and set `VITE_API_URL` to the actual API URL with `/api` appended.
5. After the static site has its actual URL, set the API's `FRONTEND_URL` to that exact HTTPS origin and redeploy/restart the API. Do not leave an old `FRONTEND_URLS` override pointing to localhost; it takes precedence over `FRONTEND_URL`.
6. In Supabase Auth URL Configuration, set Site URL to the actual frontend origin, and add these exact production redirects: the origin, `/reset-password`, and `/auth/callback`. Retain the approved localhost URLs for development. Do not add a wildcard for every Render or preview domain.
7. In the existing Google Cloud **Web application** OAuth client, add the production frontend origin. Its authorized redirect URI remains `https://jychudjmxldvjbhedmnb.supabase.co/auth/v1/callback`.
8. Run the acceptance checks below before describing the deployment as fully working.

If using Render Blueprints instead of individual services, enter the requested environment values securely in Render. The two services need each other's actual assigned URLs; correct them and rebuild/redeploy if the initial values differ. A static Vite environment variable is embedded at build time, so changing one requires another frontend build.

## Environment variables

### API — server only

| Variable | Value / source |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24.22.1` |
| `FRONTEND_URL` | Actual deployed frontend HTTPS origin; no path or trailing slash |
| `SUPABASE_URL` | `https://jychudjmxldvjbhedmnb.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Existing project's publishable key |
| `SUPABASE_SECRET_KEY` | Existing project's server secret/service-role key; enter directly in Render |
| `VERIFICATION_CODE_SECRET` | Stable randomly generated secret, at least 32 bytes; Blueprint can generate it |
| `RESEND_API_KEY` | Resend key, needed for student-email verification |
| `EMAIL_FROM` | Sender on a domain verified in Resend, e.g. `Student Marketplace <verify@YOUR_DOMAIN>` |

The backend will not start in production without its Supabase keys and verification secret. A Supabase server secret must **never** be put in a frontend `VITE_` value, GitHub, or chat.

### Static frontend — public build values

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Actual deployed API URL + `/api` |
| `VITE_SUPABASE_URL` | Existing Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Existing project's publishable key |
| `VITE_GOOGLE_AUTH_ENABLED` | `true` |
| `NODE_VERSION` | `24.22.1` |
| `SKIP_INSTALL_DEPS` | `true` because the build command performs `npm ci` |

## Email delivery requirement

The app uses Supabase Auth for account/password-reset emails and a separate Resend integration for student verification codes. Configuring one does not configure the other.

In production, student verification requests intentionally fail if `RESEND_API_KEY` or `EMAIL_FROM` is absent. Codes are never returned to the browser as they can be in development. An authenticated user must receive an actual code at their student address before this feature is considered deployed and verified. Resend's sandbox sender is not suitable for arbitrary students; configure a domain you control and verify it before inviting students to use that flow.

Also test Supabase password-reset delivery to the intended external recipients. Its built-in sender restrictions and rate limits may require custom SMTP for a public launch. Do not silently enable/disable Confirm email or change existing account policies as part of hosting setup.

## Acceptance checks

- API health is 200; its logs contain no missing production configuration errors.
- Homepage, products and businesses load real Supabase-backed API data without CORS or mixed-content errors.
- Direct visits and refreshes to `/products`, `/login`, `/seller` and `/auth/callback` serve the SPA instead of a hosting 404.
- Existing Google and email/password accounts sign in; the original profile, orders and roles remain attached.
- Login callback and password-reset links return to the deployed frontend, while approved localhost links still work for development.
- Customer cart, wishlist, orders, seller management and admin screens enforce the existing roles. Do not create a real order or modify business records without a disposable test account/data agreed for testing.
- Student verification email reaches a real authorized test student address; no development code is exposed.
- Frontend build artifacts do not contain a Supabase server secret or email-delivery key.
- The light/dark toggle, navigation and readable styling are preserved.

## Free launch limits

The static site remains available through the CDN. The free API can sleep after 15 minutes idle and may take about a minute to wake up. Free services also have monthly usage limits. This is a test launch, not an always-on service guarantee. Do not enable paid upgrades without approval.

## References

- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/static-sites
- https://render.com/docs/blueprint-spec
- https://render.com/docs/free
- https://render.com/docs/node-version
- https://supabase.com/docs/guides/auth/redirect-urls
- https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verified
