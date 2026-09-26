-- Phase 14: Seller order management and validated status transitions.

create index if not exists businesses_owner_id_idx on public.businesses(owner_id, id);
create index if not exists seller_orders_business_created_idx on public.seller_orders(business_id, created_at desc);

-- Defense-in-depth seller reads when using an authenticated Supabase session.
drop policy if exists seller_orders_owner_select on public.seller_orders;
create policy seller_orders_owner_select on public.seller_orders
  for select to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = seller_orders.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists order_items_seller_select on public.order_items;
create policy order_items_seller_select on public.order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.seller_orders so
      join public.businesses b on b.id = so.business_id
      where so.id = order_items.seller_order_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists order_status_history_seller_select on public.order_status_history;
create policy order_status_history_seller_select on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1
      from public.seller_orders so
      join public.businesses b on b.id = so.business_id
      where so.id = order_status_history.seller_order_id
        and b.owner_id = auth.uid()
    )
  );

-- Improve the existing trigger so status history records the actor and optional note
-- when a transition is made through transition_seller_order_status().
create or replace function public.log_seller_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_text text;
  v_note text;
  v_actor uuid;
begin
  v_actor_text := current_setting('app.marketplace_actor_id', true);
  v_note := nullif(current_setting('app.marketplace_status_note', true), '');

  if v_actor_text is not null and v_actor_text <> '' then
    begin
      v_actor := v_actor_text::uuid;
    exception when others then
      v_actor := null;
    end;
  end if;

  if tg_op = 'INSERT' then
    insert into public.order_status_history (seller_order_id, status, changed_by, note, created_at)
    values (new.id, new.status, v_actor, v_note, new.created_at);
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (seller_order_id, status, changed_by, note, created_at)
    values (new.id, new.status, v_actor, v_note, now());
  end if;

  return new;
end;
$$;

create or replace function public.transition_seller_order_status(
  p_seller_order_id uuid,
  p_seller_id uuid,
  p_new_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_parent_status text;
begin
  select so.*, b.owner_id
  into v_order
  from public.seller_orders so
  join public.businesses b on b.id = so.business_id
  where so.id = p_seller_order_id
  for update of so;

  if not found or v_order.owner_id <> p_seller_id then
    raise exception 'SELLER_ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_order.status in ('COMPLETED','REJECTED','CANCELLED') then
    raise exception 'SELLER_ORDER_TERMINAL' using errcode = 'P0001';
  end if;

  if p_new_status = 'REJECTED' then
    if v_order.status <> 'PENDING' then
      raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
    end if;
    if length(trim(coalesce(p_note, ''))) < 3 then
      raise exception 'REJECTION_REASON_REQUIRED' using errcode = '22023';
    end if;
  elsif v_order.status = 'PENDING' and p_new_status <> 'ACCEPTED' then
    raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
  elsif v_order.status = 'ACCEPTED' and p_new_status <> 'PREPARING' then
    raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
  elsif v_order.status = 'PREPARING' then
    if v_order.fulfilment_method = 'PICKUP' and p_new_status <> 'READY' then
      raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
    elsif v_order.fulfilment_method = 'SELLER_DELIVERY' and p_new_status <> 'OUT_FOR_DELIVERY' then
      raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
    end if;
  elsif v_order.status = 'READY' and p_new_status <> 'COMPLETED' then
    raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
  elsif v_order.status = 'OUT_FOR_DELIVERY' and p_new_status <> 'COMPLETED' then
    raise exception 'INVALID_ORDER_TRANSITION' using errcode = '22023';
  end if;

  perform set_config('app.marketplace_actor_id', p_seller_id::text, true);
  perform set_config('app.marketplace_status_note', coalesce(trim(p_note), ''), true);

  update public.seller_orders
  set status = p_new_status
  where id = p_seller_order_id;

  -- Keep the parent order's coarse status in sync with seller-order terminal states.
  if not exists (
    select 1 from public.seller_orders
    where order_id = v_order.order_id
      and status not in ('COMPLETED','REJECTED','CANCELLED')
  ) then
    if exists (
      select 1 from public.seller_orders
      where order_id = v_order.order_id and status = 'COMPLETED'
    ) then
      v_parent_status := 'COMPLETED';
    else
      v_parent_status := 'CANCELLED';
    end if;
  else
    v_parent_status := 'PENDING';
  end if;

  update public.orders set status = v_parent_status where id = v_order.order_id;

  return jsonb_build_object(
    'sellerOrderId', p_seller_order_id,
    'status', p_new_status,
    'parentOrderId', v_order.order_id,
    'parentStatus', v_parent_status
  );
end;
$$;

revoke all on function public.transition_seller_order_status(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.transition_seller_order_status(uuid, uuid, text, text) to service_role;
