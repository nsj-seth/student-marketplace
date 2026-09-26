-- Phase 16: Verified reviews and ratings.
-- Reviews are tied to completed purchases. Product reviews reference an order item;
-- business reviews reference a completed seller order. Hidden/removed reviews are
-- excluded from public aggregates.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  target_type text not null check (target_type in ('PRODUCT','BUSINESS')),
  product_id uuid references public.products(id) on delete restrict,
  business_id uuid references public.businesses(id) on delete restrict,
  order_item_id uuid references public.order_items(id) on delete restrict,
  seller_order_id uuid not null references public.seller_orders(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_target_shape_check check (
    (target_type = 'PRODUCT' and product_id is not null and order_item_id is not null and business_id is null)
    or
    (target_type = 'BUSINESS' and business_id is not null and order_item_id is null and product_id is null)
  )
);

create unique index if not exists reviews_product_purchase_unique_idx
  on public.reviews(reviewer_id, order_item_id)
  where target_type = 'PRODUCT';

create unique index if not exists reviews_business_purchase_unique_idx
  on public.reviews(reviewer_id, seller_order_id)
  where target_type = 'BUSINESS';

create index if not exists reviews_product_public_idx
  on public.reviews(product_id, status, created_at desc)
  where target_type = 'PRODUCT';

create index if not exists reviews_business_public_idx
  on public.reviews(business_id, status, created_at desc)
  where target_type = 'BUSINESS';

create index if not exists reviews_reviewer_idx
  on public.reviews(reviewer_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists reviews_public_read_active on public.reviews;

drop policy if exists reviews_reviewer_read_own on public.reviews;
create policy reviews_reviewer_read_own on public.reviews
  for select to authenticated
  using (reviewer_id = auth.uid());

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();
