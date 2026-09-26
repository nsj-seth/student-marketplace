-- Phase 13B: Atomic multi-seller order creation.
-- A single checkout creates one parent customer order and one seller order per business.
-- Product prices are snapshotted and stock is decremented inside the same PostgreSQL transaction.

create sequence if not exists public.order_number_seq start with 1000;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  customer_full_name text not null,
  customer_phone text not null,
  customer_location text not null,
  customer_note text,
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','CANCELLED')),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_created_idx
  on public.orders(customer_id, created_at desc);
create index if not exists orders_status_created_idx
  on public.orders(status, created_at desc);

create table if not exists public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  seller_order_number text not null unique,
  business_name_snapshot text not null,
  fulfilment_method text not null check (fulfilment_method in ('PICKUP','SELLER_DELIVERY')),
  status text not null default 'PENDING' check (
    status in ('PENDING','ACCEPTED','PREPARING','READY','OUT_FOR_DELIVERY','COMPLETED','REJECTED','CANCELLED')
  ),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, business_id)
);

create index if not exists seller_orders_order_idx on public.seller_orders(order_id);
create index if not exists seller_orders_business_status_idx
  on public.seller_orders(business_id, status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references public.seller_orders(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  product_slug_snapshot text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_seller_order_idx on public.order_items(seller_order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);

alter table public.orders enable row level security;
alter table public.seller_orders enable row level security;
alter table public.order_items enable row level security;

-- Defense-in-depth reads for customers. Seller/admin reads continue through Express.
drop policy if exists orders_customer_select_own on public.orders;
create policy orders_customer_select_own on public.orders
  for select to authenticated
  using (customer_id = auth.uid());

drop policy if exists seller_orders_customer_select_own on public.seller_orders;
create policy seller_orders_customer_select_own on public.seller_orders
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = seller_orders.order_id
        and o.customer_id = auth.uid()
    )
  );

drop policy if exists order_items_customer_select_own on public.order_items;
create policy order_items_customer_select_own on public.order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.seller_orders so
      join public.orders o on o.id = so.order_id
      where so.id = order_items.seller_order_id
        and o.customer_id = auth.uid()
    )
  );

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists seller_orders_set_updated_at on public.seller_orders;
create trigger seller_orders_set_updated_at
before update on public.seller_orders
for each row execute function public.set_updated_at();

create or replace function public.create_marketplace_order(
  p_user_id uuid,
  p_customer_full_name text,
  p_phone text,
  p_location text,
  p_note text,
  p_fulfilment_selections jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart public.carts%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_total numeric(12,2) := 0;
  v_business_count integer;
  v_selection_count integer;
  v_seller_index integer := 0;
  v_business record;
  v_item record;
  v_method text;
  v_seller_order_id uuid;
  v_seller_subtotal numeric(12,2);
  v_seller_order_number text;
begin
  if p_customer_full_name is null or length(trim(p_customer_full_name)) < 2 then
    raise exception 'INVALID_CUSTOMER_NAME' using errcode = '22023';
  end if;
  if p_phone is null or length(trim(p_phone)) < 7 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;
  if p_location is null or length(trim(p_location)) < 2 then
    raise exception 'INVALID_LOCATION' using errcode = '22023';
  end if;
  if jsonb_typeof(p_fulfilment_selections) <> 'array' then
    raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
  end if;

  select * into v_cart
  from public.carts
  where user_id = p_user_id and status = 'ACTIVE'
  for update;

  if not found then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.cart_items ci where ci.cart_id = v_cart.id) then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  -- Lock all referenced product rows in stable UUID order before validating.
  perform p.id
  from public.products p
  join public.cart_items ci on ci.product_id = p.id
  where ci.cart_id = v_cart.id
  order by p.id
  for update of p;

  -- Lock referenced businesses too so availability/fulfilment cannot change mid-checkout.
  perform b.id
  from public.businesses b
  join public.products p on p.business_id = b.id
  join public.cart_items ci on ci.product_id = p.id
  where ci.cart_id = v_cart.id
  order by b.id
  for update of b;

  -- Validate every item against authoritative product/business state.
  for v_item in
    select
      ci.id as cart_item_id,
      ci.quantity,
      p.id as product_id,
      p.business_id,
      p.name as product_name,
      p.slug as product_slug,
      p.price,
      p.stock_quantity,
      p.status as product_status,
      b.name as business_name,
      b.status as business_status,
      b.availability_status,
      b.pickup_enabled,
      b.seller_delivery_enabled
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.businesses b on b.id = p.business_id
    where ci.cart_id = v_cart.id
  loop
    if v_item.business_status <> 'ACTIVE' then
      raise exception 'PRODUCT_NOT_AVAILABLE' using errcode = 'P0001';
    end if;
    if v_item.availability_status <> 'OPEN' then
      raise exception 'BUSINESS_UNAVAILABLE:%', v_item.business_name using errcode = 'P0001';
    end if;
    if v_item.product_status <> 'ACTIVE' then
      raise exception 'PRODUCT_NOT_AVAILABLE:%', v_item.product_name using errcode = 'P0001';
    end if;
    if v_item.stock_quantity < v_item.quantity then
      raise exception 'INSUFFICIENT_STOCK:%:%', v_item.product_name, v_item.stock_quantity using errcode = 'P0001';
    end if;
    v_total := v_total + (v_item.price * v_item.quantity);
  end loop;

  select count(distinct p.business_id) into v_business_count
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart.id;

  select count(*) into v_selection_count
  from jsonb_array_elements(p_fulfilment_selections);

  if v_selection_count <> v_business_count then
    raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
  end if;

  -- No duplicate business selections.
  if exists (
    select 1
    from (
      select elem->>'businessId' as business_id, count(*) as c
      from jsonb_array_elements(p_fulfilment_selections) elem
      group by elem->>'businessId'
      having count(*) > 1
    ) d
  ) then
    raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
  end if;

  -- Ensure selections correspond exactly to businesses in the cart and methods are supported.
  for v_business in
    select distinct b.id, b.name, b.pickup_enabled, b.seller_delivery_enabled
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.businesses b on b.id = p.business_id
    where ci.cart_id = v_cart.id
    order by b.id
  loop
    select elem->>'method' into v_method
    from jsonb_array_elements(p_fulfilment_selections) elem
    where elem->>'businessId' = v_business.id::text
    limit 1;

    if v_method is null then
      raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
    end if;

    if v_method = 'PICKUP' and not v_business.pickup_enabled then
      raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
    elsif v_method = 'SELLER_DELIVERY' and not v_business.seller_delivery_enabled then
      raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
    elsif v_method not in ('PICKUP','SELLER_DELIVERY') then
      raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(p_fulfilment_selections) elem
    where not exists (
      select 1
      from public.cart_items ci
      join public.products p on p.id = ci.product_id
      where ci.cart_id = v_cart.id
        and p.business_id::text = elem->>'businessId'
    )
  ) then
    raise exception 'INVALID_FULFILMENT_SELECTION' using errcode = '22023';
  end if;

  v_order_number := 'ORD-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');

  insert into public.orders (
    order_number, customer_id, customer_full_name, customer_phone,
    customer_location, customer_note, status, total
  ) values (
    v_order_number, p_user_id, trim(p_customer_full_name), trim(p_phone),
    trim(p_location), nullif(trim(coalesce(p_note, '')), ''), 'PENDING', round(v_total, 2)
  ) returning id into v_order_id;

  for v_business in
    select distinct b.id, b.name
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.businesses b on b.id = p.business_id
    where ci.cart_id = v_cart.id
    order by b.id
  loop
    v_seller_index := v_seller_index + 1;
    v_seller_order_number := v_order_number || '-' || lpad(v_seller_index::text, 2, '0');

    select elem->>'method' into v_method
    from jsonb_array_elements(p_fulfilment_selections) elem
    where elem->>'businessId' = v_business.id::text
    limit 1;

    select round(sum(p.price * ci.quantity), 2) into v_seller_subtotal
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart.id
      and p.business_id = v_business.id;

    insert into public.seller_orders (
      order_id, business_id, seller_order_number, business_name_snapshot,
      fulfilment_method, status, subtotal
    ) values (
      v_order_id, v_business.id, v_seller_order_number, v_business.name,
      v_method, 'PENDING', v_seller_subtotal
    ) returning id into v_seller_order_id;

    insert into public.order_items (
      seller_order_id, product_id, product_name_snapshot, product_slug_snapshot,
      unit_price, quantity, subtotal
    )
    select
      v_seller_order_id,
      p.id,
      p.name,
      p.slug,
      p.price,
      ci.quantity,
      round(p.price * ci.quantity, 2)
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart.id
      and p.business_id = v_business.id;
  end loop;

  -- Decrement inventory only after all validations and order rows are ready.
  update public.products p
  set
    stock_quantity = p.stock_quantity - ci.quantity,
    status = case when p.stock_quantity - ci.quantity = 0 then 'OUT_OF_STOCK' else p.status end,
    updated_at = now()
  from public.cart_items ci
  where ci.cart_id = v_cart.id
    and ci.product_id = p.id;

  update public.carts
  set status = 'CONVERTED', updated_at = now()
  where id = v_cart.id;

  return jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'total', round(v_total, 2),
    'sellerOrderCount', v_business_count,
    'status', 'PENDING'
  );
end;
$$;

revoke all on function public.create_marketplace_order(uuid, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_marketplace_order(uuid, text, text, text, text, jsonb)
  to service_role;

comment on table public.orders is 'Customer-facing parent order spanning one or more businesses.';
comment on table public.seller_orders is 'Seller-specific sub-order owned by one marketplace business.';
comment on table public.order_items is 'Purchase-time product snapshots used for historical order integrity.';
comment on function public.create_marketplace_order(uuid, text, text, text, text, jsonb) is
  'Trusted-server atomic checkout: validates cart, snapshots prices, creates split orders, decrements stock, and converts cart.';
