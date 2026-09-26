# Phase 13B — Atomic Multi-Seller Order Creation

The checkout page now places a real order through `POST /api/orders`.

After success it displays the parent order number, total, number of seller sub-orders, and initial `PENDING` status. Detailed customer order history and tracking arrive in Phase 13C.

No payment is collected in the MVP.
