-- Phase 19D: Marketplace management + analytics.
-- Adds safe featured-listing controls and supporting indexes for admin dashboards.

alter table public.businesses
  add column if not exists is_featured boolean not null default false;

alter table public.products
  add column if not exists is_featured boolean not null default false;

create index if not exists businesses_featured_status_idx
  on public.businesses(is_featured, status, created_at desc);
create index if not exists products_featured_status_idx
  on public.products(is_featured, status, created_at desc);
create index if not exists orders_created_at_idx
  on public.orders(created_at desc);
create index if not exists seller_orders_status_created_idx
  on public.seller_orders(status, created_at desc);

create or replace function public.admin_set_featured_business(
  p_admin_id uuid,
  p_business_id uuid,
  p_featured boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_status text;
  v_current boolean;
begin
  select exists(
    select 1 from public.user_roles where user_id = p_admin_id and role = 'ADMIN'
  ) into v_is_admin;
  if not v_is_admin then raise exception 'ADMIN_REQUIRED'; end if;

  select status, is_featured into v_status, v_current
  from public.businesses where id = p_business_id for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND'; end if;
  if p_featured and v_status <> 'ACTIVE' then raise exception 'BUSINESS_NOT_ACTIVE'; end if;

  if v_current = p_featured then
    return jsonb_build_object('businessId', p_business_id, 'featured', p_featured, 'changed', false);
  end if;

  update public.businesses
  set is_featured = p_featured, updated_at = now()
  where id = p_business_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    case when p_featured then 'FEATURE_BUSINESS' else 'UNFEATURE_BUSINESS' end,
    'BUSINESS',
    p_business_id,
    jsonb_build_object('featured', p_featured)
  );

  return jsonb_build_object('businessId', p_business_id, 'featured', p_featured, 'changed', true);
end;
$$;

create or replace function public.admin_set_featured_product(
  p_admin_id uuid,
  p_product_id uuid,
  p_featured boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_status text;
  v_business_status text;
  v_current boolean;
begin
  select exists(
    select 1 from public.user_roles where user_id = p_admin_id and role = 'ADMIN'
  ) into v_is_admin;
  if not v_is_admin then raise exception 'ADMIN_REQUIRED'; end if;

  select p.status, b.status, p.is_featured
  into v_status, v_business_status, v_current
  from public.products p
  join public.businesses b on b.id = p.business_id
  where p.id = p_product_id
  for update of p;

  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if p_featured and (v_status not in ('ACTIVE','OUT_OF_STOCK') or v_business_status <> 'ACTIVE') then
    raise exception 'PRODUCT_NOT_PUBLIC';
  end if;

  if v_current = p_featured then
    return jsonb_build_object('productId', p_product_id, 'featured', p_featured, 'changed', false);
  end if;

  update public.products
  set is_featured = p_featured, updated_at = now()
  where id = p_product_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    case when p_featured then 'FEATURE_PRODUCT' else 'UNFEATURE_PRODUCT' end,
    'PRODUCT',
    p_product_id,
    jsonb_build_object('featured', p_featured)
  );

  return jsonb_build_object('productId', p_product_id, 'featured', p_featured, 'changed', true);
end;
$$;

revoke all on function public.admin_set_featured_business(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_featured_business(uuid, uuid, boolean) to service_role;
revoke all on function public.admin_set_featured_product(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_featured_product(uuid, uuid, boolean) to service_role;
