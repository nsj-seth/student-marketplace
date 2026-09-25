# Student Marketplace API — Phase 05B

This cumulative backend checkpoint includes authentication, profiles, roles, universities/categories, seller application drafts, and student-email verification.

## New migration
Run `supabase/migrations/006_student_email_verification.sql` after migrations 001–005.

## Development email behavior
If `RESEND_API_KEY` and `EMAIL_FROM` are not configured, development mode returns the 6-digit code to the frontend so the verification flow can be tested locally. Production refuses to send verification without an email provider.

For real email delivery later, configure `RESEND_API_KEY` and a verified `EMAIL_FROM` address. `VERIFICATION_CODE_SECRET` should be a long random server-only value.
