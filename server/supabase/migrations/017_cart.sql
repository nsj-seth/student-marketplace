-- Phase 12: authenticated shopping cart foundation

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CONVERTED', 'ABANDONED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists carts_one_active_per_user_idx
  on public.carts(user_id)
  where status = 'ACTIVE';

create index if not exists carts_user_status_idx on public.carts(user_id, status);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists cart_items_product_idx on public.cart_items(product_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- These policies provide defense in depth if authenticated clients ever read their
-- own cart directly. The application still routes cart mutations through Express.
drop policy if exists carts_select_own on public.carts;
create policy carts_select_own on public.carts
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists cart_items_select_own on public.cart_items;
create policy cart_items_select_own on public.cart_items
  for select to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  );
