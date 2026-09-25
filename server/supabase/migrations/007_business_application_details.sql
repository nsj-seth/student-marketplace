-- Phase 05C: Business application details and submission.

alter table public.seller_applications
  add column if not exists business_name text,
  add column if not exists description text,
  add column if not exists location_text text,
  add column if not exists contact_phone text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists pickup_enabled boolean not null default false,
  add column if not exists seller_delivery_enabled boolean not null default false,
  add column if not exists logo_path text;

create table if not exists public.seller_application_categories (
  seller_application_id uuid not null references public.seller_applications(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (seller_application_id, category_id)
);

create index if not exists seller_application_categories_category_idx
  on public.seller_application_categories(category_id);

alter table public.seller_application_categories enable row level security;

drop policy if exists "seller_application_categories_select_own" on public.seller_application_categories;
create policy "seller_application_categories_select_own"
on public.seller_application_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.seller_applications sa
    where sa.id = seller_application_id
      and sa.applicant_id = (select auth.uid())
  )
);

-- Public bucket for business logos. Writes are limited to a user's own top-level folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "business_logos_insert_own_folder" on storage.objects;
create policy "business_logos_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "business_logos_update_own_folder" on storage.objects;
create policy "business_logos_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "business_logos_delete_own_folder" on storage.objects;
create policy "business_logos_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

comment on table public.seller_application_categories is
  'Categories selected by an applicant before the business is approved and created.';
