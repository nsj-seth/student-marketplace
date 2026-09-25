-- Phase 09: Marketplace homepage and discovery support.
-- Featured flags are platform-controlled. Seller-facing APIs do not expose mutation of these fields.

alter table public.businesses
  add column if not exists is_featured boolean not null default false;

alter table public.products
  add column if not exists is_featured boolean not null default false;

create index if not exists businesses_public_discovery_idx
  on public.businesses (status, is_featured, approved_at desc);

create index if not exists products_public_discovery_idx
  on public.products (status, is_featured, created_at desc);
