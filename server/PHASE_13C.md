# Phase 13C — Customer Orders and Tracking Foundation

Adds customer order history and detail endpoints plus a durable seller-order status timeline.

## Endpoints
- `GET /api/orders`
- `GET /api/orders/:id`
- Existing `POST /api/orders`

Customers can only retrieve orders whose `customer_id` matches the authenticated user.

## Migration
Run `019_customer_order_tracking.sql` after migration 018.

The migration creates `order_status_history`, backfills existing seller orders with their initial status, and adds triggers that automatically record future seller-order status changes.
