-- Phase 13C: Customer order history and seller-order status timeline foundation.

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references public.seller_orders(id) on delete cascade,
  status text not null check (
    status in ('PENDING','ACCEPTED','PREPARING','READY','OUT_FOR_DELIVERY','COMPLETED','REJECTED','CANCELLED')
  ),
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_seller_order_created_idx
  on public.order_status_history(seller_order_id, created_at asc);

alter table public.order_status_history enable row level security;

drop policy if exists order_status_history_customer_select_own on public.order_status_history;
create policy order_status_history_customer_select_own on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1
      from public.seller_orders so
      join public.orders o on o.id = so.order_id
      where so.id = order_status_history.seller_order_id
        and o.customer_id = auth.uid()
    )
  );

-- Backfill the initial status for orders created before this migration.
insert into public.order_status_history (seller_order_id, status, created_at)
select so.id, so.status, so.created_at
from public.seller_orders so
where not exists (
  select 1
  from public.order_status_history osh
  where osh.seller_order_id = so.id
);

create or replace function public.log_seller_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (seller_order_id, status, created_at)
    values (new.id, new.status, new.created_at);
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (seller_order_id, status, created_at)
    values (new.id, new.status, now());
  end if;

  return new;
end;
$$;

drop trigger if exists seller_orders_log_status_insert on public.seller_orders;
create trigger seller_orders_log_status_insert
after insert on public.seller_orders
for each row execute function public.log_seller_order_status_change();

drop trigger if exists seller_orders_log_status_update on public.seller_orders;
create trigger seller_orders_log_status_update
after update of status on public.seller_orders
for each row execute function public.log_seller_order_status_change();
