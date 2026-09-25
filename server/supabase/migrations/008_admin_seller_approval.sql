-- Phase 06: Admin seller approval.
-- Approval atomically creates the business, copies application categories,
-- grants SELLER privileges, and marks the application APPROVED.

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  source_application_id uuid not null unique references public.seller_applications(id) on delete restrict,
  business_type text not null check (business_type in ('STUDENT_BUSINESS', 'OTHER_BUSINESS')),
  name text not null,
  slug text not null unique,
  description text not null,
  university_id uuid references public.universities(id) on delete restrict,
  location_text text not null,
  contact_phone text not null,
  social_links jsonb not null default '{}'::jsonb,
  pickup_enabled boolean not null default false,
  seller_delivery_enabled boolean not null default false,
  logo_path text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED', 'SUSPENDED')),
  availability_status text not null default 'OPEN' check (availability_status in ('OPEN', 'UNAVAILABLE')),
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on public.businesses(owner_id, created_at desc);
create index if not exists businesses_status_idx on public.businesses(status, created_at desc);
create index if not exists businesses_university_idx on public.businesses(university_id);
create index if not exists businesses_business_type_idx on public.businesses(business_type);

create table if not exists public.business_categories (
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (business_id, category_id)
);

create index if not exists business_categories_category_idx
  on public.business_categories(category_id);

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.business_categories enable row level security;

-- Public marketplace clients may only read approved active businesses.
drop policy if exists "active_businesses_public_read" on public.businesses;
create policy "active_businesses_public_read"
on public.businesses
for select
to anon, authenticated
using (status = 'ACTIVE');

drop policy if exists "active_business_categories_public_read" on public.business_categories;
create policy "active_business_categories_public_read"
on public.business_categories
for select
to anon, authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'ACTIVE'
  )
);

create or replace function public.review_seller_application(
  p_application_id uuid,
  p_admin_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.seller_applications%rowtype;
  v_business_id uuid;
  v_university_id uuid;
  v_slug text;
begin
  if not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_admin_id
      and ur.role = 'ADMIN'::public.app_role
  ) then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if p_decision not in ('APPROVE', 'REJECT') then
    raise exception 'INVALID_REVIEW_DECISION' using errcode = '22023';
  end if;

  select * into v_application
  from public.seller_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'SELLER_APPLICATION_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_application.status <> 'PENDING' then
    raise exception 'SELLER_APPLICATION_NOT_PENDING' using errcode = 'P0001';
  end if;

  if p_decision = 'REJECT' then
    update public.seller_applications
    set
      status = 'REJECTED',
      reviewed_at = now(),
      reviewed_by = p_admin_id,
      review_note = nullif(trim(coalesce(p_note, '')), '')
    where id = p_application_id;

    return jsonb_build_object(
      'applicationId', p_application_id,
      'status', 'REJECTED',
      'businessId', null
    );
  end if;

  if v_application.business_name is null
     or v_application.description is null
     or v_application.location_text is null
     or v_application.contact_phone is null
     or v_application.logo_path is null
     or not (v_application.pickup_enabled or v_application.seller_delivery_enabled) then
    raise exception 'SELLER_APPLICATION_INCOMPLETE' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.seller_application_categories sac
    where sac.seller_application_id = p_application_id
  ) then
    raise exception 'SELLER_APPLICATION_INCOMPLETE' using errcode = '23514';
  end if;

  if v_application.business_type = 'STUDENT_BUSINESS' then
    select sv.university_id into v_university_id
    from public.student_verifications sv
    where sv.seller_application_id = p_application_id
      and sv.applicant_id = v_application.applicant_id
      and sv.status = 'VERIFIED'
    limit 1;

    if v_university_id is null then
      raise exception 'STUDENT_VERIFICATION_REQUIRED' using errcode = '23514';
    end if;
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(v_application.business_name), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then
    v_slug := 'business';
  end if;
  v_slug := v_slug || '-' || left(replace(p_application_id::text, '-', ''), 8);

  insert into public.businesses (
    owner_id,
    source_application_id,
    business_type,
    name,
    slug,
    description,
    university_id,
    location_text,
    contact_phone,
    social_links,
    pickup_enabled,
    seller_delivery_enabled,
    logo_path,
    status,
    availability_status,
    approved_at
  ) values (
    v_application.applicant_id,
    p_application_id,
    v_application.business_type,
    v_application.business_name,
    v_slug,
    v_application.description,
    v_university_id,
    v_application.location_text,
    v_application.contact_phone,
    v_application.social_links,
    v_application.pickup_enabled,
    v_application.seller_delivery_enabled,
    v_application.logo_path,
    'ACTIVE',
    'OPEN',
    now()
  )
  returning id into v_business_id;

  insert into public.business_categories (business_id, category_id)
  select v_business_id, sac.category_id
  from public.seller_application_categories sac
  where sac.seller_application_id = p_application_id
  on conflict (business_id, category_id) do nothing;

  insert into public.user_roles (user_id, role, granted_by)
  values (v_application.applicant_id, 'SELLER'::public.app_role, p_admin_id)
  on conflict (user_id, role) do nothing;

  update public.seller_applications
  set
    status = 'APPROVED',
    reviewed_at = now(),
    reviewed_by = p_admin_id,
    review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_application_id;

  return jsonb_build_object(
    'applicationId', p_application_id,
    'status', 'APPROVED',
    'businessId', v_business_id
  );
end;
$$;

revoke all on function public.review_seller_application(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_seller_application(uuid, uuid, text, text) to service_role;

comment on table public.businesses is
  'Approved marketplace businesses. One user may own many businesses.';
comment on function public.review_seller_application(uuid, uuid, text, text) is
  'Atomic trusted-server workflow for approving or rejecting a pending seller application.';
