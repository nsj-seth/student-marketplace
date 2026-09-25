-- Phase 07A: Seller business management.
-- Business detail/category updates are applied atomically in PostgreSQL.

create or replace function public.update_owned_business(
  p_business_id uuid,
  p_owner_id uuid,
  p_name text,
  p_description text,
  p_location_text text,
  p_contact_phone text,
  p_social_links jsonb,
  p_pickup_enabled boolean,
  p_seller_delivery_enabled boolean,
  p_logo_path text,
  p_category_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses%rowtype;
  v_distinct_category_count integer;
  v_valid_category_count integer;
begin
  select * into v_business
  from public.businesses
  where id = p_business_id
    and owner_id = p_owner_id
  for update;

  if not found then
    raise exception 'BUSINESS_NOT_FOUND' using errcode = 'P0002';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null
     or length(trim(p_name)) > 120 then
    raise exception 'INVALID_BUSINESS_NAME' using errcode = '22023';
  end if;

  if length(trim(coalesce(p_description, ''))) < 20
     or length(trim(p_description)) > 2000 then
    raise exception 'INVALID_BUSINESS_DESCRIPTION' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_location_text, '')), '') is null
     or length(trim(p_location_text)) > 250 then
    raise exception 'INVALID_BUSINESS_LOCATION' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_contact_phone, '')), '') is null
     or length(trim(p_contact_phone)) > 40 then
    raise exception 'INVALID_BUSINESS_PHONE' using errcode = '22023';
  end if;

  if not (p_pickup_enabled or p_seller_delivery_enabled) then
    raise exception 'FULFILMENT_REQUIRED' using errcode = '23514';
  end if;

  select count(distinct category_id)
  into v_distinct_category_count
  from unnest(coalesce(p_category_ids, array[]::uuid[])) as selected(category_id);

  if v_distinct_category_count < 1 or v_distinct_category_count > 5 then
    raise exception 'INVALID_CATEGORY_COUNT' using errcode = '23514';
  end if;

  select count(*)
  into v_valid_category_count
  from public.categories c
  where c.id = any(p_category_ids)
    and c.is_active = true;

  if v_valid_category_count <> v_distinct_category_count then
    raise exception 'INVALID_CATEGORY' using errcode = '23514';
  end if;

  -- Existing application-era logos remain valid. Any replacement must live in
  -- this authenticated owner's business-specific storage folder.
  if p_logo_path is null or trim(p_logo_path) = '' then
    raise exception 'BUSINESS_LOGO_REQUIRED' using errcode = '23514';
  end if;

  if p_logo_path is distinct from v_business.logo_path
     and p_logo_path not like (p_owner_id::text || '/businesses/' || p_business_id::text || '/%') then
    raise exception 'INVALID_LOGO_PATH' using errcode = '23514';
  end if;

  update public.businesses
  set
    name = trim(p_name),
    description = trim(p_description),
    location_text = trim(p_location_text),
    contact_phone = trim(p_contact_phone),
    social_links = coalesce(p_social_links, '{}'::jsonb),
    pickup_enabled = p_pickup_enabled,
    seller_delivery_enabled = p_seller_delivery_enabled,
    logo_path = p_logo_path
  where id = p_business_id;

  delete from public.business_categories
  where business_id = p_business_id;

  insert into public.business_categories (business_id, category_id)
  select p_business_id, category_id
  from (
    select distinct unnest(p_category_ids) as category_id
  ) selected;

  return jsonb_build_object(
    'businessId', p_business_id,
    'updated', true
  );
end;
$$;

revoke all on function public.update_owned_business(uuid, uuid, text, text, text, text, jsonb, boolean, boolean, text, uuid[]) from public, anon, authenticated;
grant execute on function public.update_owned_business(uuid, uuid, text, text, text, text, jsonb, boolean, boolean, text, uuid[]) to service_role;

comment on function public.update_owned_business(uuid, uuid, text, text, text, text, jsonb, boolean, boolean, text, uuid[]) is
  'Trusted-server atomic seller business update with ownership/category/logo validation.';
