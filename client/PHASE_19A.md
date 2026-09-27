# Phase 19A — Admin Users

Adds admin-only user search/filtering, role/account-status visibility, suspension/reactivation, protected admin accounts, and audit logging.

## Migration
Run `supabase/migrations/024_admin_user_management.sql`.

## Endpoints
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`

Reactivation restores account access but deliberately does not automatically reactivate businesses. Business states are managed in Phase 19B.
