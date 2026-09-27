-- Phase 19B: Admin business + product management.
-- Adds reversible moderation metadata and protected status-change functions.

alter table public.businesses
  add column if not exists admin_previous_status text,
  add column if not exists admin_status_reason text,
  add column if not exists admin_status_changed_at timestamptz,
  add column if not exists admin_status_changed_by uuid references public.profiles(id) on delete set null;

alter table public.products
  add column if not exists admin_previous_status text,
  add column if not exists admin_status_reason text,
  add column if not exists admin_status_changed_at timestamptz,
  add column if not exists admin_status_changed_by uuid references public.profiles(id) on delete set null;

create index if not exists businesses_status_created_idx on public.businesses(status, created_at desc);
create index if not exists products_status_created_idx on public.products(status, created_at desc);

create or replace function public.admin_set_business_status(
  p_admin_id uuid,
  p_business_id uuid,
  p_action text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_current_status text;
  v_previous_status text;
  v_new_status text;
begin
  select exists(
    select 1 from public.user_roles where user_id = p_admin_id and role = 'ADMIN'
  ) into v_is_admin;
  if not v_is_admin then raise exception 'ADMIN_REQUIRED'; end if;

  if p_action not in ('DISABLE', 'REACTIVATE') then
    raise exception 'INVALID_BUSINESS_ACTION';
  end if;

  select status, admin_previous_status
  into v_current_status, v_previous_status
  from public.businesses
  where id = p_business_id
  for update;

  if not found then raise exception 'BUSINESS_NOT_FOUND'; end if;

  if p_action = 'DISABLE' then
    if v_current_status = 'DISABLED' then
      return jsonb_build_object('businessId', p_business_id, 'status', v_current_status, 'changed', false);
    end if;
    v_new_status := 'DISABLED';
    update public.businesses
    set admin_previous_status = v_current_status,
        status = v_new_status,
        admin_status_reason = nullif(trim(coalesce(p_reason, '')), ''),
        admin_status_changed_at = now(),
        admin_status_changed_by = p_admin_id,
        updated_at = now()
    where id = p_business_id;
  else
    if v_current_status = 'ACTIVE' then
      return jsonb_build_object('businessId', p_business_id, 'status', v_current_status, 'changed', false);
    end if;
    -- Publicly reactivation always returns the business to ACTIVE. SUSPENDED may
    -- have come from account moderation; admins are explicitly choosing to restore it here.
    v_new_status := 'ACTIVE';
    update public.businesses
    set status = v_new_status,
        admin_previous_status = null,
        admin_status_reason = null,
        admin_status_changed_at = now(),
        admin_status_changed_by = p_admin_id,
        updated_at = now()
    where id = p_business_id;
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    case when p_action = 'DISABLE' then 'DISABLE_BUSINESS' else 'REACTIVATE_BUSINESS' end,
    'BUSINESS',
    p_business_id,
    jsonb_build_object('fromStatus', v_current_status, 'toStatus', v_new_status, 'reason', nullif(trim(coalesce(p_reason, '')), ''))
  );

  return jsonb_build_object('businessId', p_business_id, 'status', v_new_status, 'changed', true);
end;
$$;

revoke all on function public.admin_set_business_status(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_business_status(uuid, uuid, text, text) to service_role;

create or replace function public.admin_set_product_status(
  p_admin_id uuid,
  p_product_id uuid,
  p_action text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_current_status text;
  v_previous_status text;
  v_stock integer;
  v_new_status text;
begin
  select exists(
    select 1 from public.user_roles where user_id = p_admin_id and role = 'ADMIN'
  ) into v_is_admin;
  if not v_is_admin then raise exception 'ADMIN_REQUIRED'; end if;

  if p_action not in ('HIDE', 'RESTORE') then
    raise exception 'INVALID_PRODUCT_ACTION';
  end if;

  select status, admin_previous_status, stock_quantity
  into v_current_status, v_previous_status, v_stock
  from public.products
  where id = p_product_id
  for update;

  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if v_current_status = 'REMOVED' then raise exception 'PRODUCT_REMOVED'; end if;

  if p_action = 'HIDE' then
    if v_current_status = 'HIDDEN' then
      return jsonb_build_object('productId', p_product_id, 'status', v_current_status, 'changed', false);
    end if;
    v_new_status := 'HIDDEN';
    update public.products
    set admin_previous_status = v_current_status,
        status = v_new_status,
        admin_status_reason = nullif(trim(coalesce(p_reason, '')), ''),
        admin_status_changed_at = now(),
        admin_status_changed_by = p_admin_id,
        updated_at = now()
    where id = p_product_id;
  else
    if v_current_status <> 'HIDDEN' then
      return jsonb_build_object('productId', p_product_id, 'status', v_current_status, 'changed', false);
    end if;

    if v_previous_status in ('ACTIVE','INACTIVE','OUT_OF_STOCK') then
      v_new_status := v_previous_status;
    else
      v_new_status := case when v_stock <= 0 then 'OUT_OF_STOCK' else 'ACTIVE' end;
    end if;

    if v_new_status = 'ACTIVE' and v_stock <= 0 then v_new_status := 'OUT_OF_STOCK'; end if;

    update public.products
    set status = v_new_status,
        admin_previous_status = null,
        admin_status_reason = null,
        admin_status_changed_at = now(),
        admin_status_changed_by = p_admin_id,
        updated_at = now()
    where id = p_product_id;
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    case when p_action = 'HIDE' then 'HIDE_PRODUCT' else 'RESTORE_PRODUCT' end,
    'PRODUCT',
    p_product_id,
    jsonb_build_object('fromStatus', v_current_status, 'toStatus', v_new_status, 'reason', nullif(trim(coalesce(p_reason, '')), ''))
  );

  return jsonb_build_object('productId', p_product_id, 'status', v_new_status, 'changed', true);
end;
$$;

revoke all on function public.admin_set_product_status(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_product_status(uuid, uuid, text, text) to service_role;
