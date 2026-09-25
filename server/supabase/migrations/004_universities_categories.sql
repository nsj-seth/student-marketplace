-- Phase 04: universities and categories

-- Schema hardening for projects that had an older profiles table before Phase 02.
alter table if exists public.profiles add column if not exists avatar_path text;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  slug text not null unique,
  country text not null default 'Ghana',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists universities_name_unique_idx
  on public.universities (lower(name));

create index if not exists universities_active_idx
  on public.universities (is_active);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_name_unique_idx
  on public.categories (lower(name));

create index if not exists categories_active_idx
  on public.categories (is_active);

-- Reuse the generic updated_at trigger function created in the foundation migration.
drop trigger if exists set_universities_updated_at on public.universities;
create trigger set_universities_updated_at
before update on public.universities
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Seed universities. Upserts make this migration safe to run more than once.
insert into public.universities (name, short_name, slug, country, is_active)
values
  ('Kwame Nkrumah University of Science and Technology', 'KNUST', 'knust', 'Ghana', true),
  ('University of Ghana', 'UG', 'university-of-ghana', 'Ghana', true),
  ('University of Cape Coast', 'UCC', 'university-of-cape-coast', 'Ghana', true),
  ('University of Professional Studies, Accra', 'UPSA', 'upsa', 'Ghana', true)
on conflict (slug) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  country = excluded.country;

insert into public.categories (name, slug, description, is_active)
values
  ('Food', 'food', 'Meals, snacks, baked goods, drinks, and related food products.', true),
  ('Fashion', 'fashion', 'Clothing, footwear, and fashion items.', true),
  ('Electronics', 'electronics', 'Electronic devices, accessories, and related products.', true),
  ('Beauty', 'beauty', 'Beauty, grooming, and personal-care products.', true),
  ('Books', 'books', 'Books, learning materials, and academic resources.', true),
  ('Accessories', 'accessories', 'Personal, fashion, and everyday accessories.', true),
  ('Services', 'services', 'Services offered by marketplace businesses.', true),
  ('Other', 'other', 'Products or services that do not fit another category.', true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

alter table public.universities enable row level security;
alter table public.categories enable row level security;

-- Public clients may only read active reference data. Marketplace writes go through Express.
drop policy if exists "Active universities are publicly readable" on public.universities;
create policy "Active universities are publicly readable"
on public.universities
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Active categories are publicly readable" on public.categories;
create policy "Active categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (is_active = true);
