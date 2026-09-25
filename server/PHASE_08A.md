# Phase 08A — Product CRUD + Inventory

Adds seller-owned product management with server-side business ownership checks, business-category validation, stock quantities, seller activation/deactivation, and soft removal.

Run migration `011_product_management_inventory.sql` after migrations 001–010.

Seller API:
- `GET /api/seller/businesses/:businessId/products`
- `POST /api/seller/businesses/:businessId/products`
- `GET /api/seller/businesses/:businessId/products/:productId`
- `PATCH /api/seller/businesses/:businessId/products/:productId`
- `PATCH /api/seller/businesses/:businessId/products/:productId/inventory`
- `PATCH /api/seller/businesses/:businessId/products/:productId/status`
- `DELETE /api/seller/businesses/:businessId/products/:productId` (soft remove)

Images are intentionally deferred to Phase 08B. Public product browsing is deferred to Phase 08C.
