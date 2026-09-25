-- Phase 08B: Product images and storage.

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_sort_idx
  on public.product_images(product_id, sort_order, created_at);

create unique index if not exists product_images_one_primary_idx
  on public.product_images(product_id)
  where is_primary = true;

alter table public.product_images enable row level security;

-- Product image metadata is managed through the trusted Express API.
-- Public image files themselves are served from the public storage bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_insert_own_folder" on storage.objects;
create policy "product_images_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "product_images_update_own_folder" on storage.objects;
create policy "product_images_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "product_images_delete_own_folder" on storage.objects;
create policy "product_images_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.set_product_primary_image(
  p_product_id uuid,
  p_image_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.product_images
    where id = p_image_id and product_id = p_product_id
  ) then
    raise exception 'IMAGE_NOT_FOUND';
  end if;

  update public.product_images
  set is_primary = false
  where product_id = p_product_id and is_primary = true;

  update public.product_images
  set is_primary = true
  where id = p_image_id and product_id = p_product_id;
end;
$$;

create or replace function public.reorder_product_images(
  p_product_id uuid,
  p_image_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_count integer;
  supplied_count integer;
begin
  select count(*) into expected_count
  from public.product_images
  where product_id = p_product_id;

  supplied_count := coalesce(array_length(p_image_ids, 1), 0);

  if supplied_count <> expected_count then
    raise exception 'IMAGE_SET_MISMATCH';
  end if;

  if exists (
    select 1
    from unnest(p_image_ids) as supplied(id)
    where not exists (
      select 1 from public.product_images pi
      where pi.id = supplied.id and pi.product_id = p_product_id
    )
  ) then
    raise exception 'IMAGE_SET_MISMATCH';
  end if;

  update public.product_images pi
  set sort_order = ordered.ordinality - 1
  from unnest(p_image_ids) with ordinality as ordered(id, ordinality)
  where pi.id = ordered.id
    and pi.product_id = p_product_id;
end;
$$;

revoke all on function public.set_product_primary_image(uuid, uuid) from public;
revoke all on function public.reorder_product_images(uuid, uuid[]) from public;
grant execute on function public.set_product_primary_image(uuid, uuid) to service_role;
grant execute on function public.reorder_product_images(uuid, uuid[]) to service_role;

comment on table public.product_images is
  'Ordered product image metadata. Files live in the Supabase product-images storage bucket.';
