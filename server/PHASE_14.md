# Phase 14 — Seller Order Management

Adds seller-scoped order listing and detail APIs, validated status transitions, pickup/delivery-specific workflows, rejection reasons, ownership enforcement, parent-order status synchronization, and actor-aware timeline entries.

New migration: `020_seller_order_management.sql`

Seller routes:
- `GET /api/seller/orders`
- `GET /api/seller/orders/:id`
- `PATCH /api/seller/orders/:id/status`
