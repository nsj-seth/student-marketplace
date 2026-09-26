-- Phase 17: In-app notifications.
-- Notifications are durable records owned by a recipient profile. Database triggers
-- generate notifications for important marketplace events so the behavior is not
-- dependent on a particular web/mobile client.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  action_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create or replace function public.notify_admins_on_seller_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'PENDING' and old.status is distinct from new.status then
    insert into public.notifications (
      recipient_id, type, title, message, entity_type, entity_id, action_url
    )
    select
      ur.user_id,
      'SELLER_APPLICATION_SUBMITTED',
      'New seller application',
      coalesce(new.business_name, 'A seller') || ' submitted an application for review.',
      'SELLER_APPLICATION',
      new.id,
      '/admin/seller-applications/' || new.id::text
    from public.user_roles ur
    where ur.role = 'ADMIN'::public.app_role;
  end if;

  if new.status in ('APPROVED','REJECTED','CORRECTION_REQUIRED','SUSPENDED')
     and old.status is distinct from new.status then
    insert into public.notifications (
      recipient_id, type, title, message, entity_type, entity_id, action_url
    ) values (
      new.applicant_id,
      'SELLER_APPLICATION_' || new.status,
      case new.status
        when 'APPROVED' then 'Seller application approved'
        when 'REJECTED' then 'Seller application rejected'
        when 'CORRECTION_REQUIRED' then 'Seller application needs changes'
        else 'Seller application suspended'
      end,
      case new.status
        when 'APPROVED' then 'Your seller application has been approved.'
        when 'REJECTED' then 'Your seller application was rejected.'
        when 'CORRECTION_REQUIRED' then 'Your seller application needs corrections before it can be approved.'
        else 'Your seller application has been suspended.'
      end,
      'SELLER_APPLICATION',
      new.id,
      '/sell'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists seller_application_notifications on public.seller_applications;
create trigger seller_application_notifications
after update of status on public.seller_applications
for each row execute function public.notify_admins_on_seller_application();

create or replace function public.notify_customer_on_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, action_url
  ) values (
    new.customer_id,
    'ORDER_PLACED',
    'Order placed',
    'Your order ' || new.order_number || ' was placed successfully.',
    'ORDER',
    new.id,
    '/orders/' || new.id::text
  );
  return new;
end;
$$;

drop trigger if exists order_created_notification on public.orders;
create trigger order_created_notification
after insert on public.orders
for each row execute function public.notify_customer_on_order_created();

create or replace function public.notify_seller_on_new_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select b.owner_id into v_owner_id
  from public.businesses b
  where b.id = new.business_id;

  if v_owner_id is not null then
    insert into public.notifications (
      recipient_id, type, title, message, entity_type, entity_id, action_url
    ) values (
      v_owner_id,
      'NEW_SELLER_ORDER',
      'New order received',
      'You received a new order for ' || new.business_name_snapshot || '.',
      'SELLER_ORDER',
      new.id,
      '/seller/orders/' || new.id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists seller_order_created_notification on public.seller_orders;
create trigger seller_order_created_notification
after insert on public.seller_orders
for each row execute function public.notify_seller_on_new_order();

create or replace function public.notify_customer_on_seller_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_title text;
  v_message text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select o.customer_id, o.id, o.order_number
  into v_customer_id, v_order_id, v_order_number
  from public.orders o
  where o.id = new.order_id;

  v_title := case new.status
    when 'ACCEPTED' then 'Order accepted'
    when 'PREPARING' then 'Order is being prepared'
    when 'READY' then 'Order ready for pickup'
    when 'OUT_FOR_DELIVERY' then 'Order out for delivery'
    when 'COMPLETED' then 'Order completed'
    when 'REJECTED' then 'Order rejected'
    when 'CANCELLED' then 'Order cancelled'
    else 'Order updated'
  end;

  v_message := new.business_name_snapshot || ' updated order ' || v_order_number || ' to ' || replace(new.status, '_', ' ') || '.';

  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, action_url
  ) values (
    v_customer_id,
    'ORDER_STATUS_' || new.status,
    v_title,
    v_message,
    'SELLER_ORDER',
    new.id,
    '/orders/' || v_order_id::text
  );

  return new;
end;
$$;

drop trigger if exists seller_order_status_notification on public.seller_orders;
create trigger seller_order_status_notification
after update of status on public.seller_orders
for each row execute function public.notify_customer_on_seller_order_status();

create or replace function public.notify_seller_on_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_owner_id uuid;
  v_business_name text;
begin
  if new.target_type = 'BUSINESS' then
    v_business_id := new.business_id;
  else
    select p.business_id into v_business_id
    from public.products p
    where p.id = new.product_id;
  end if;

  select b.owner_id, b.name into v_owner_id, v_business_name
  from public.businesses b
  where b.id = v_business_id;

  if v_owner_id is not null then
    insert into public.notifications (
      recipient_id, type, title, message, entity_type, entity_id, action_url
    ) values (
      v_owner_id,
      'NEW_REVIEW',
      'New review received',
      'A customer left a ' || new.rating::text || '-star review for ' || v_business_name || '.',
      'REVIEW',
      new.id,
      '/seller/reviews'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists review_created_notification on public.reviews;
create trigger review_created_notification
after insert on public.reviews
for each row execute function public.notify_seller_on_review();

comment on table public.notifications is
  'In-app marketplace notifications. Email and push channels can be added later without changing event producers.';
