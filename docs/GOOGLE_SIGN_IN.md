# Google sign-in setup

The app supports **Continue with Google** on `/login` and `/register`. It uses the existing Supabase Auth project, profile trigger and server-managed roles. No new tables or migrations are required.

The UI is hidden until `VITE_GOOGLE_AUTH_ENABLED=true` is set. Enable it only after the provider and redirect settings below are ready. Email/password sign-in, verification, and password reset remain available.

For the connected `student-marketplace` project, the Supabase callback URL is:

```text
https://jychudjmxldvjbhedmnb.supabase.co/auth/v1/callback
```

## 1. Create Google credentials

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) in a project you control.
2. Complete Branding, Audience and contact details for Student Marketplace. For an external app in Testing, add the Google accounts you will test with as test users. Basic sign-in only needs identity scopes: `openid`, `email`, and `profile`.
3. In Clients, create an OAuth client of type **Web application**.
4. Add `http://localhost:5173` as an authorized JavaScript origin. Add your actual deployed frontend origin when it exists.
5. In Supabase, open **Authentication → Sign In / Providers → Google** and copy the displayed OAuth callback URL. It will normally be `https://<project-ref>.supabase.co/auth/v1/callback`.
6. Add that exact Supabase URL to Google's **Authorized redirect URIs**.
7. Save the client ID and client secret in Supabase's Google provider settings, and enable the provider. Leave nonce validation enabled.

**Do not put the Google client secret in a `VITE_` variable, source code, GitHub, or chat.** Store it only in the provider's server-side configuration.

## 2. Configure the app return URLs

In **Supabase → Authentication → URL Configuration**, preserve the existing Site URL and password-reset/email-confirmation redirects, and add:

| Setting | Local development | Production |
| --- | --- | --- |
| Google authorized redirect URI | Supabase's `/auth/v1/callback` URL | The same Supabase callback URL |
| Supabase allowed app redirect | `http://localhost:5173/auth/callback` | `https://YOUR_ACTUAL_FRONTEND_HOST/auth/callback` |
| Supabase Site URL | Your existing local frontend origin during development | Your actual production frontend origin |

The two callbacks serve different purposes: Google returns to Supabase; Supabase then returns to the app's `/auth/callback` page. Use exact production URLs, not a broad wildcard. If you use `127.0.0.1` or a different port, add the matching frontend origin/callback rather than mixing hosts. The supplied Vercel SPA rewrite already supports the new route; other hosts must serve `index.html` for it.

## 3. Enable the button

Add this to your existing **client/.env** without changing your other values:

```dotenv
VITE_GOOGLE_AUTH_ENABLED=true
```

Restart Vite. In production, set the same frontend environment variable and rebuild/redeploy. This flag is public; no Google secret belongs in the frontend. Set it back to `false` and restart/rebuild to hide Google sign-in while leaving email login active.

## Existing accounts and permissions

Supabase handles automatic linking of compatible identities with the same verified email. The app does not merge accounts or copy their orders. Test an existing confirmed Gmail account and verify its Supabase user ID stays the same before rollout. Different email addresses are separate accounts; manual identity linking is outside this change.

A new Google account is provisioned by the existing `handle_new_auth_user` trigger from migrations 002/003, which creates the profile and grants only `CUSTOMER`. Names are read from Google/Supabase's `full_name` metadata, with the existing email-name fallback. Google sign-in does not grant `SELLER` or `ADMIN` and does not replace student email verification. Existing server checks still validate sessions, suspension status, and roles.

## Implementation

- Google OAuth asks only for basic identity scopes; it does not request Gmail access or offline Google access.
- Supabase's existing browser implicit flow remains in use so this change does not impose same-browser PKCE requirements on existing email/password recovery links. The SDK consumes the returned session; the app does not log or manually transmit provider tokens.
- The dedicated callback waits for the session/role initialization, removes provider parameters from browser history, and returns to a validated local destination saved in this tab. External URLs and auth loops are rejected; blocked storage falls back to home.
- API calls to load roles run outside `onAuthStateChange`; late responses for a previous account cannot restore its roles. Role lookup failures fail closed.

## Acceptance checks before enabling for all users

1. With the flag off, confirm email signup/login and Forgot password still work.
2. With the flag on, confirm the Google button is readable in light/dark modes and on mobile. Clicking it must work even with empty email/password fields.
3. Sign in with a **new** Google account: verify one auth user/profile and only a customer role, then sign out and back in.
4. Sign in with the Google account for an **existing confirmed** email/password account: verify the same user ID, profile, orders and approved seller roles; confirm no duplicate account or unintended privilege.
5. Start at `/seller/orders` while logged out. After successful Google sign-in, an approved seller returns there; a customer remains blocked by the existing role guard.
6. Cancel/deny the Google prompt: the callback should show a readable retry message without exposing provider tokens or raw descriptions.
7. Refresh after successful sign-in; check session persistence and sign-out. Recheck password reset and email verification in a different browser.
8. Repeat on the deployed frontend after adding its exact origins and callbacks.

Local automated checks cover return-path validation, limited OAuth scopes, failed initiation cleanup, blocked storage, safe errors, and theme contrast. Live Google consent, automatic linking, deployed callbacks, and the live database trigger still need a real configured project and test accounts.

## Troubleshooting

- **Google button missing:** set the Vite flag in `client/.env`, then restart Vite (or rebuild production).
- **Unsupported provider / provider not enabled:** enable Google in the same Supabase project used by `VITE_SUPABASE_URL`.
- **redirect_uri_mismatch:** Google's authorized redirect URI must match the Supabase callback URL, not the frontend callback.
- **Returns to the wrong frontend:** verify Supabase's allowed redirect list and Site URL. A disallowed `redirectTo` can fall back to the Site URL.
- **Access blocked / test user:** check Audience and test users in Google Auth Platform. Complete the appropriate publishing/verification steps before broad release.
- **Database error saving a new user:** inspect the existing auth-user trigger and its logs; do not create duplicate profile/role tables.

## Sources

- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Supabase auth state events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Google sign-in branding](https://developers.google.com/identity/branding-guidelines) (logo asset: https://developers.google.com/static/identity/images/g-logo.png)
