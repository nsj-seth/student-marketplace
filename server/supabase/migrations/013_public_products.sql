-- Phase 08C: indexes supporting public product discovery.
-- Public marketplace reads still go through the Express API; no direct browser
-- table policy is added here.

create index if not exists products_public_status_created_idx
  on public.products(status, created_at desc)
  where status in ('ACTIVE', 'OUT_OF_STOCK');

create index if not exists products_public_business_idx
  on public.products(business_id, status, created_at desc)
  where status in ('ACTIVE', 'OUT_OF_STOCK');

create index if not exists products_public_category_idx
  on public.products(category_id, status, created_at desc)
  where status in ('ACTIVE', 'OUT_OF_STOCK');

comment on table public.products is
  'Marketplace products. Public API exposes only ACTIVE/OUT_OF_STOCK products whose businesses are ACTIVE.';
