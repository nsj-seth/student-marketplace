# UI Modernization — Phase 9: Authentication + Seller Onboarding

Phase 9 modernizes authentication and seller onboarding while preserving all Supabase auth, verification, seller-application and approval logic.

## Shared authentication shell

A reusable authentication layout now powers:

- Login
- Registration
- Forgot password
- Reset password

It provides:

- premium dark marketplace showcase panel
- consistent branding
- icon-led trust/value points
- responsive two-column desktop layout
- single-column mobile layout

## Login

Updated with:

- modern email/password inputs
- Lucide icons
- show/hide password control
- clearer validation/error state
- stronger sign-in CTA
- cleaner forgot-password path

Existing login redirect behavior is unchanged.

## Registration

Updated with:

- modern full-name/email/password fields
- show/hide password control
- password guidance
- success/error feedback
- stronger account creation CTA

Existing Supabase registration and confirmation behavior is unchanged.

## Password recovery

Updated with:

- modern recovery layout
- clear account-security guidance
- reset-link feedback
- loading state

## Password reset

Updated with:

- modern password field
- show/hide password control
- 8-character validation
- success/error feedback

## Seller registration

Updated with:

- seller onboarding hero
- visible 3-step onboarding journey
- Student Business and Community Business selection cards
- modern application status cards
- clear DRAFT / PENDING / APPROVED / REJECTED states
- direct student-verification and business-details actions
- approved-business path into Seller Hub

Existing seller-application creation and role refresh logic is unchanged.

## Student verification

Updated with:

- modern verification hero
- 3-step verification guidance
- university selector
- student email field
- verification-code request flow
- development-code presentation
- 6-digit confirmation input
- verified success state
- direct continuation to business details

Existing verification cooldown, attempts, expiry and backend behavior are unchanged.

## Business application

Updated with:

- modern business application hero
- status badge
- student-verification warning
- structured business identity form
- category cards
- fulfilment cards
- social/contact fields
- logo preview/upload
- submission readiness checklist
- save-draft action
- submit-for-review action

Existing application validation, logo storage, draft saving and submission logic are unchanged.

## No backend changes

No authentication, database, RBAC, student-verification or seller-approval logic was changed.

## Verification

After pulling:

```bash
cd ~/projects/student-marketplace/client
npm install
npm run check
npm run dev
```

Test:

Authentication:
- /login
- /register
- /forgot-password
- /reset-password
- show/hide password controls
- invalid login
- successful login
- short registration password
- successful registration
- password reset link flow

Seller onboarding:
- /sell
- start Student Business application
- start Community Business application
- student verification request
- development verification code
- verification confirmation
- business details
- category selection
- pickup/delivery selection
- logo upload
- save draft
- submission-readiness checklist
- submit for review
- pending state
- approved state
- rejected state
- desktop / tablet / phone widths
