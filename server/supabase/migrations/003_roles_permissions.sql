-- Phase 03: Roles and authorization.
-- Adds multi-role support while keeping role assignment server-controlled.

-- Repair compatibility with any pre-Phase-02 profiles table that was missing avatar_path.
alter table public.profiles
add column if not exists avatar_path text;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('CUSTOMER', 'SELLER', 'ADMIN');
  end if;
end $$;

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id) on delete set null,
  primary key (user_id, role)
);

create index if not exists user_roles_role_idx on public.user_roles(role);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);

-- Existing accounts are customers by default.
insert into public.user_roles (user_id, role)
select p.id, 'CUSTOMER'::public.app_role
from public.profiles p
on conflict (user_id, role) do nothing;

-- New auth accounts get a profile plus the CUSTOMER role.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if char_length(requested_name) < 2 then
    requested_name := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, requested_name)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'CUSTOMER'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

alter table public.user_roles enable row level security;

-- Users may inspect their own roles when using Supabase directly.
-- They may not insert, update, or delete roles themselves.
drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.user_roles is
  'Application authorization roles. Role assignment is controlled by trusted backend/admin workflows.';
