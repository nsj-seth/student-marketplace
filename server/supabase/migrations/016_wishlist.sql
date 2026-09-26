-- Phase 11: Wishlist

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlist_items_user_product_unique unique (user_id, product_id)
);

create index if not exists wishlist_items_user_id_idx
  on public.wishlist_items (user_id, created_at desc);

create index if not exists wishlist_items_product_id_idx
  on public.wishlist_items (product_id);

alter table public.wishlist_items enable row level security;

-- The application uses the trusted Express API for wishlist CRUD.
-- No direct anon/authenticated policies are added here intentionally.
