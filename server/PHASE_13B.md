# Phase 13B — Atomic Multi-Seller Order Creation

Adds the trusted checkout transaction that creates one parent order plus seller-specific sub-orders.

## Database
Run `supabase/migrations/018_atomic_multi_seller_orders.sql`.

## Endpoint
`POST /api/orders`

The server ignores client prices and re-reads authoritative products, businesses, stock and prices inside PostgreSQL. Product rows are locked before stock validation. If any check or insert fails, PostgreSQL rolls the entire function back.

Successful checkout:
1. Locks the active cart and product rows.
2. Revalidates product/business availability and stock.
3. Revalidates fulfilment per business.
4. Creates `orders`.
5. Creates one `seller_orders` row per business.
6. Creates snapshot `order_items`.
7. Decrements product stock and marks zero-stock products `OUT_OF_STOCK`.
8. Marks the cart `CONVERTED`.

No payment is collected in the MVP.
