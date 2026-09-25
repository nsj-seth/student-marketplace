-- Phase 08A: Seller product CRUD and basic inventory.
-- Product deletion is soft deletion via status = REMOVED.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','OUT_OF_STOCK','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

create index if not exists products_business_status_idx
  on public.products(business_id, status, created_at desc);

create index if not exists products_category_status_idx
  on public.products(category_id, status, created_at desc);

create index if not exists products_name_idx
  on public.products(name);

alter table public.products enable row level security;

-- The Express API uses the trusted server client for seller writes. Public read
-- policies are added in the public-product phase (08C), not here.

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

comment on table public.products is
  'Marketplace products owned through businesses. Important records are soft-removed to preserve future order history.';
comment on column public.products.stock_quantity is
  'Authoritative inventory quantity. Checkout will later decrement this atomically in PostgreSQL.';
comment on column public.products.status is
  'ACTIVE/INACTIVE seller states, OUT_OF_STOCK inventory state, HIDDEN moderation state, REMOVED soft deletion state.';
