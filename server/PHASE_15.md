# Phase 15 — Customer Order Tracking Polish

This phase improves the customer-facing order experience without changing the database schema.

## Backend additions
- Derives a more accurate aggregate status from seller orders.
- Supports `PARTIALLY_COMPLETED` when some sellers complete while others reject/cancel.
- Adds customer-friendly order status summaries.
- Adds per-seller progress percentages and labels.
- Exposes rejection/cancellation reasons from status history.
- Adds aggregate seller-order counts for active, completed, and unfulfilled seller orders.

## Database
No migration is required for Phase 15. Existing Phase 14 status-history data is reused.
