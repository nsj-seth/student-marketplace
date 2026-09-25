-- Phase 0/1: Database foundation only.
-- Domain tables are intentionally introduced in later feature phases.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Reusable trigger function for maintaining updated_at columns.';
