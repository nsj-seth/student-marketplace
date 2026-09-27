-- Phase 19C: indexes supporting admin order browsing and operational review.
create index if not exists orders_admin_created_idx on public.orders(created_at desc);
create index if not exists seller_orders_admin_status_created_idx on public.seller_orders(status, created_at desc);
create index if not exists seller_orders_admin_order_created_idx on public.seller_orders(order_id, created_at);

-- pg_trgm was enabled for marketplace search in Phase 10. These indexes make
-- admin order searches by customer/business snapshot scale better as data grows.
create index if not exists orders_customer_name_trgm_idx
  on public.orders using gin (customer_full_name gin_trgm_ops);
create index if not exists seller_orders_business_name_trgm_idx
  on public.seller_orders using gin (business_name_snapshot gin_trgm_ops);
