# Phase 13A — Checkout Data + Fulfilment Selection

Adds checkout preparation without creating orders yet.

## Backend
- `GET /api/checkout/preview`
- `POST /api/checkout/validate`
- Re-validates cart, stock, business availability and fulfilment methods.
- Requires one fulfilment selection per business.
- Uses authoritative current cart/product data.

## Frontend
- `/checkout`
- Customer name, phone, location and optional note.
- Fulfilment selection per business.
- Validation against backend before order creation is introduced in Phase 13B.

## Database
No migration is required in this phase.
