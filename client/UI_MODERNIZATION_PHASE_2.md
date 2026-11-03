# UI Modernization — Phase 2: Customer Application Shell

Phase 2 modernizes the shared customer-facing application shell while preserving all routes, authentication, roles and marketplace behavior.

## Updated header

The global header now includes:

- Lucide icon branding
- modern desktop navigation
- compact marketplace search
- wishlist icon with live count
- cart icon with live quantity badge
- notification bell with unread badge
- responsive account menu
- mobile navigation drawer
- mobile search
- seller/admin shortcuts for eligible accounts
- proper sign-out actions

## Live customer state

For authenticated users the shell now loads:

- unread notification count
- cart total quantity
- wishlist item count

These values refresh when route navigation occurs.

## Account menu

The desktop account control now exposes:

- Profile
- My orders
- Seller Hub when the user has SELLER
- Admin when the user has ADMIN
- Sign out

## Mobile shell

The previous text-only hamburger menu has been replaced with a Lucide-based responsive menu containing:

- Explore
- Stores
- Categories
- Orders
- Wishlist
- Cart
- Notifications
- Account
- Sell on marketplace
- Seller/Admin workspace shortcuts where applicable

## Styling compatibility

Legacy plain-CSS selectors are now scoped away from the new shadcn/Tailwind primitives using `data-ui` attributes.

This allows the migration to continue incrementally without breaking pages that still use the old CSS system.

## Not changed

This phase does not change:

- marketplace APIs
- authentication behavior
- RBAC
- seller/admin workspace navigation
- product cards
- homepage layout
- explore pages
- cart/checkout pages

Those are handled in later modernization phases.

## Verification

After pulling:

```bash
cd ~/projects/student-marketplace/client
npm install
npm run check
npm run dev
```

Check the shell as:

- logged-out visitor
- logged-in customer
- seller account
- desktop width
- tablet width
- phone width
