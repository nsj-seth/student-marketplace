-- Phase 19A: Admin user management.
-- Adds suspension metadata, audit logs, and a protected database function for account status changes.

alter table public.profiles
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_admin_idx
  on public.admin_audit_logs(admin_id, created_at desc);
create index if not exists admin_audit_logs_target_idx
  on public.admin_audit_logs(target_type, target_id, created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on table public.admin_audit_logs from anon, authenticated;
grant all on table public.admin_audit_logs to service_role;

create or replace function public.admin_set_user_account_status(
  p_admin_id uuid,
  p_user_id uuid,
  p_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_actor_admin boolean;
  v_target_is_admin boolean;
  v_current_status text;
begin
  select exists(
    select 1 from public.user_roles
    where user_id = p_admin_id and role = 'ADMIN'
  ) into v_is_actor_admin;

  if not v_is_actor_admin then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_status not in ('ACTIVE', 'SUSPENDED') then
    raise exception 'INVALID_ACCOUNT_STATUS';
  end if;

  if p_admin_id = p_user_id and p_status = 'SUSPENDED' then
    raise exception 'CANNOT_SUSPEND_SELF';
  end if;

  select exists(
    select 1 from public.user_roles
    where user_id = p_user_id and role = 'ADMIN'
  ) into v_target_is_admin;

  if v_target_is_admin and p_status = 'SUSPENDED' then
    raise exception 'CANNOT_SUSPEND_ADMIN';
  end if;

  select account_status into v_current_status
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if v_current_status = p_status then
    return jsonb_build_object(
      'userId', p_user_id,
      'status', p_status,
      'changed', false
    );
  end if;

  if p_status = 'SUSPENDED' then
    update public.profiles
    set account_status = 'SUSPENDED',
        suspension_reason = nullif(trim(coalesce(p_reason, '')), ''),
        suspended_at = now(),
        suspended_by = p_admin_id,
        updated_at = now()
    where id = p_user_id;

    -- Businesses remain in the database but are removed from the public marketplace.
    update public.businesses
    set status = 'SUSPENDED', updated_at = now()
    where owner_id = p_user_id and status = 'ACTIVE';
  else
    update public.profiles
    set account_status = 'ACTIVE',
        suspension_reason = null,
        suspended_at = null,
        suspended_by = null,
        updated_at = now()
    where id = p_user_id;

    -- Deliberately do not reactivate businesses automatically. An admin may have
    -- independently suspended/disabled a business, and Phase 19B manages those states.
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    case when p_status = 'SUSPENDED' then 'SUSPEND_USER' else 'REACTIVATE_USER' end,
    'USER',
    p_user_id,
    jsonb_build_object(
      'fromStatus', v_current_status,
      'toStatus', p_status,
      'reason', nullif(trim(coalesce(p_reason, '')), '')
    )
  );

  return jsonb_build_object(
    'userId', p_user_id,
    'status', p_status,
    'changed', true
  );
end;
$$;

revoke all on function public.admin_set_user_account_status(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_set_user_account_status(uuid, uuid, text, text)
  to service_role;
