# Phase 17 — In-App Notifications

Adds durable in-app notifications for seller applications, orders, seller-order status changes, and reviews.

New API:
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Run migration `022_notifications.sql`.
