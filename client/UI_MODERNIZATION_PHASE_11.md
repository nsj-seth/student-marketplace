# UI Modernization — Phase 11: Admin

Phase 11 brings the Admin workspace onto the same Tailwind + shadcn + Lucide design system as the rest of the application.

## Admin workspace navigation

The Admin sidebar now uses icon-led navigation for:

- Overview
- Seller applications
- Users
- Businesses
- Products
- Orders
- Reports
- Marketplace
- Reference data

Existing routes and RBAC are unchanged.

## Admin dashboard

Updated with:

- modern control-center header
- priority cards for seller applications, moderation and recent orders
- marketplace health metric cards
- order-status breakdown
- seller-order fulfilment breakdown
- recent orders
- top businesses by completed order value
- management quick actions
- business mix and 30-day order value

No analytics logic changed.

## Users

Updated with:

- modern search / role / status filters
- user cards
- account-status badges
- joined / sign-in metadata
- protected-admin messaging
- suspend / reactivate workflow
- modern moderation confirmation panel
- responsive pagination

Existing account protections and suspension logic are unchanged.

## Businesses

Updated with:

- modern business cards
- owner / location / university metadata
- product count and availability
- platform-status badges
- public storefront links
- disable / reactivate moderation flow
- modern reason panel
- responsive pagination

Existing admin business moderation logic is unchanged.

## Products

Updated with:

- modern product cards
- search and status filters
- category / price / stock summaries
- public product links
- hide / restore moderation flow
- responsive pagination

Existing historical-integrity rules are unchanged.

## Orders

Updated with:

- modern order search/filter controls
- customer / business / seller-order summaries
- order-status badges
- order cards and detail navigation
- responsive pagination

The order data remains read-only to Admin.

## Seller applications

Updated with:

- modern status filters
- application cards
- applicant / business-type metadata
- submitted timestamps
- dedicated review detail page
- student-verification information
- business details
- approve / reject actions
- review notes
- reviewed-state presentation

Existing approval logic still creates the business and grants seller access atomically.

## Reports & moderation

Updated with:

- modern status / target filters
- moderation report cards
- report detail review panel
- decision selector
- supported moderation action selector
- admin notes
- save-decision workflow

Existing supported moderation actions remain:

- hide product
- disable business
- suspend user
- no action

## Marketplace curation

Updated with:

- business search
- product search
- featured counts
- feature / unfeature controls
- eligibility-aware disabled states

Existing homepage curation behavior is unchanged.

## Reference data

Updated with:

- modern university management
- modern category management
- create forms
- active / disabled states
- disable / reactivate actions

Existing database-backed reference-data behavior is unchanged.

## Admin order detail

Updated with:

- modern order summary
- customer information
- seller-order sections
- item breakdown
- fulfilment details
- visual timelines

Admin remains read-only for operational seller-order transitions.

## No backend changes

No API, database, RBAC, seller-approval, moderation, analytics, order, or marketplace-curation logic was changed.

## Verification

After pulling:

```bash
cd ~/projects/student-marketplace/client
npm install
npm run check
npm run dev
```

Test with an Admin account:

- /admin
- /admin/users
- /admin/businesses
- /admin/products
- /admin/orders
- /admin/orders/:id
- /admin/seller-applications
- /admin/seller-applications/:id
- /admin/reports
- /admin/marketplace
- /admin/reference-data

Test actions:

- search/filter users
- suspend / reactivate user
- disable / reactivate business
- hide / restore product
- order filters
- seller application approve / reject
- moderation report resolve
- feature / unfeature business
- feature / unfeature product
- create university
- disable / reactivate university
- create category
- disable / reactivate category

Responsive:

- desktop
- Chromebook / tablet width
- phone width
- horizontal Admin nav at smaller widths
- no horizontal overflow
