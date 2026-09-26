-- Phase 18: Reports and moderation.

alter table public.profiles
  add column if not exists account_status text not null default 'ACTIVE'
  check (account_status in ('ACTIVE','SUSPENDED'));

create index if not exists profiles_account_status_idx on public.profiles(account_status);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('PRODUCT','BUSINESS','SELLER','USER')),
  target_id uuid not null,
  target_label text,
  target_context jsonb not null default '{}'::jsonb,
  reason text not null check (reason in ('SPAM','FRAUD','INAPPROPRIATE','MISLEADING','HARASSMENT','OTHER')),
  description text,
  status text not null default 'PENDING' check (status in ('PENDING','REVIEWED','DISMISSED','ACTION_TAKEN')),
  admin_action text check (admin_action is null or admin_action in ('NONE','HIDE_PRODUCT','DISABLE_BUSINESS','SUSPEND_USER')),
  admin_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists reports_target_idx on public.reports(target_type, target_id, created_at desc);
create index if not exists reports_reporter_idx on public.reports(reporter_id, created_at desc);

alter table public.reports enable row level security;

-- The application uses the trusted Express API for report CRUD. RLS remains closed
-- to anon/authenticated clients as defense in depth.
revoke all on table public.reports from anon, authenticated;
grant all on table public.reports to service_role;

create or replace function public.resolve_moderation_report(
  p_report_id uuid,
  p_admin_id uuid,
  p_status text,
  p_action text default 'NONE',
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports%rowtype;
  v_is_admin boolean;
  v_target_user uuid;
begin
  select exists(
    select 1 from public.user_roles
    where user_id = p_admin_id and role = 'ADMIN'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_status not in ('REVIEWED','DISMISSED','ACTION_TAKEN') then
    raise exception 'INVALID_REPORT_STATUS';
  end if;

  if p_action not in ('NONE','HIDE_PRODUCT','DISABLE_BUSINESS','SUSPEND_USER') then
    raise exception 'INVALID_MODERATION_ACTION';
  end if;

  select * into v_report
  from public.reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'REPORT_NOT_FOUND';
  end if;

  if p_action = 'HIDE_PRODUCT' then
    if v_report.target_type <> 'PRODUCT' then
      raise exception 'ACTION_TARGET_MISMATCH';
    end if;
    update public.products set status = 'HIDDEN', updated_at = now() where id = v_report.target_id;
    if not found then raise exception 'TARGET_NOT_FOUND'; end if;
  elsif p_action = 'DISABLE_BUSINESS' then
    if v_report.target_type <> 'BUSINESS' then
      raise exception 'ACTION_TARGET_MISMATCH';
    end if;
    update public.businesses set status = 'DISABLED', updated_at = now() where id = v_report.target_id;
    if not found then raise exception 'TARGET_NOT_FOUND'; end if;
  elsif p_action = 'SUSPEND_USER' then
    if v_report.target_type not in ('SELLER','USER') then
      raise exception 'ACTION_TARGET_MISMATCH';
    end if;
    v_target_user := v_report.target_id;
    if exists(select 1 from public.user_roles where user_id = v_target_user and role = 'ADMIN') then
      raise exception 'CANNOT_SUSPEND_ADMIN';
    end if;
    update public.profiles set account_status = 'SUSPENDED', updated_at = now() where id = v_target_user;
    if not found then raise exception 'TARGET_NOT_FOUND'; end if;
    update public.businesses set status = 'SUSPENDED', updated_at = now()
      where owner_id = v_target_user and status = 'ACTIVE';
  end if;

  update public.reports
  set status = p_status,
      admin_action = p_action,
      admin_note = nullif(trim(coalesce(p_note,'')), ''),
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  where id = p_report_id;

  return jsonb_build_object('reportId', p_report_id, 'status', p_status, 'action', p_action);
end;
$$;

revoke all on function public.resolve_moderation_report(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.resolve_moderation_report(uuid, uuid, text, text, text) to service_role;

create or replace function public.notify_admins_on_new_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, type, title, message, entity_type, entity_id, action_url)
  select ur.user_id,
         'NEW_REPORT',
         'New marketplace report',
         'A ' || lower(new.target_type) || ' was reported for ' || lower(replace(new.reason, '_', ' ')) || '.',
         'REPORT',
         new.id,
         '/admin/reports'
  from public.user_roles ur
  where ur.role = 'ADMIN'::public.app_role;
  return new;
end;
$$;

drop trigger if exists reports_notify_admins on public.reports;
create trigger reports_notify_admins
after insert on public.reports
for each row execute function public.notify_admins_on_new_report();
