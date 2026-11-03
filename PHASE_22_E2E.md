# Phase 22 — End-to-End Verification

Phase 22 is the final verification pass for the Student & Community Marketplace after the Phase 23 UI redesign and Phase 24 realistic demo-data simulation.

## Automated checks

### Backend quality gate

```bash
cd ~/projects/student-marketplace/server
npm run check
```

### Frontend quality gate

```bash
cd ~/projects/student-marketplace/client
npm run check
```

### API E2E smoke test

Start the backend first:

```bash
cd ~/projects/student-marketplace/server
npm run dev
```

Then, from a second terminal:

```bash
cd ~/projects/student-marketplace/server
npm run test:e2e-smoke
```

Defaults:

- Customer: `demo.user19@demo.studentmarket.local`
- Seller: `demo.user01@demo.studentmarket.local`
- Password: `DemoPass!2026`
- API: `http://localhost:5000/api`

To include admin API verification:

```bash
E2E_ADMIN_EMAIL='your-admin-email' E2E_ADMIN_PASSWORD='your-admin-password' npm run test:e2e-smoke
```

Do not commit credentials.

## Automated smoke coverage

- health endpoint
- populated marketplace homepage
- public products and businesses
- customer login/profile/wishlist/cart/checkout preview/orders/notifications/reports
- customer denial from seller/admin APIs
- seller login/businesses/products/orders/notifications
- seller denial from admin APIs
- optional admin dashboard/users/applications/businesses/products/orders/reports/marketplace management

## Manual browser E2E checklist

### Public marketplace

1. Homepage shows populated featured/new products and businesses with images.
2. Product and business search work.
3. Product and business filter sidebars scroll independently and Apply Filters remains reachable.
4. Category, university, seller type, availability, stock, fulfilment and price filters behave correctly.
5. Product detail and business storefront pages show the expected data and reviews.
6. Hidden/inactive/disabled listings are not publicly exposed where prohibited.

### Customer

1. Log in as `demo.user19@demo.studentmarket.local`.
2. Wishlist add/remove works.
3. Cart quantity/remove/clear works.
4. Add products from at least two businesses.
5. Checkout preview groups items per seller.
6. Select fulfilment independently per seller.
7. Submit a fresh checkout and verify parent + seller sub-orders.
8. Verify stock decreases and converted cart cannot be replayed.
9. Order history/detail/timelines load.
10. Notifications can be marked read.
11. Submit a report and verify My Reports.
12. Reviews are allowed only for eligible completed purchases; duplicates/ineligible attempts are blocked.

### Seller

1. Log in as `demo.user01@demo.studentmarket.local`.
2. Seller Hub and owned business load.
3. Update availability and verify public storefront state.
4. Product create/edit/image management works.
5. Seller order queue loads.
6. PICKUP lifecycle: PENDING → ACCEPTED → PREPARING → READY → COMPLETED.
7. DELIVERY lifecycle: PENDING → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → COMPLETED.
8. Pending order rejection requires a reason.
9. Invalid status transitions are blocked.
10. Reviews load.
11. Seller cannot access admin APIs or another seller's owned resources.

### Admin

Use your existing admin account.

1. Dashboard shows populated metrics.
2. Seller applications can be approved/rejected.
3. User search/filter and suspend/reactivate work.
4. Admin/self suspension protections hold.
5. Business disable/reactivate works.
6. Product hide/restore works.
7. Global orders are readable but lifecycle remains seller-controlled.
8. Reports can be reviewed/dismissed/actioned.
9. Feature/unfeature products and businesses works.
10. Category/university reference-data management works.

### Responsive/UI

Test desktop, about 900px, about 720px, and phone width.

- no horizontal page overflow
- navigation remains usable
- seller/admin workspace navigation scrolls horizontally at smaller widths
- filters remain usable
- cart/checkout stack correctly
- tables/long rows remain accessible
- buttons remain reachable
- status is not communicated by colour alone
- keyboard focus indicators are visible

## Security/regression checklist

- `.env` and secret keys are absent from Git history.
- client prices do not control checkout totals.
- insufficient stock is rejected.
- converted carts cannot be replayed.
- suspended users receive authorization failures.
- seller ownership is enforced server-side.
- admin routes require ADMIN.
- CORS allow-list remains enforced.
- malformed JSON and invalid media types fail safely.

## Exit criteria

Phase 22 is complete when:

- server `npm run check` passes
- client `npm run check` passes
- `npm run test:e2e-smoke` reports zero failures
- admin smoke checks pass when admin credentials are supplied
- manual customer/seller/admin critical-path checks pass
- no release-blocking UI or authorization defect remains
