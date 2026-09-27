# Phase 19C — Admin Orders

Adds admin-only order visibility across the whole marketplace.

## API
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`

Admins can search by parent order number, seller-order number, customer name/phone, or business name and filter by overall or seller-order status.

The detail endpoint exposes customer checkout data, seller-order breakdowns, purchase snapshots, fulfilment method, and status timelines. It is read-only: sellers remain responsible for operational status transitions.
