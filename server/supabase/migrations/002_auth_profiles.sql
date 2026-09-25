-- Phase 02: Authentication profile foundation.
-- Supabase Auth remains the identity provider. This table stores application profile data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

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

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Creates an application profile whenever Supabase Auth creates a user.';

-- Recreate safely in case this migration is reapplied in a disposable environment.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;

-- These policies are defense-in-depth for any user-scoped Supabase access.
-- Marketplace business operations will still go through Express.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
