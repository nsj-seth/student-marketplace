-- Phase 05A: Seller registration foundation.
-- Users can start seller applications as drafts. Approval and business creation come later.

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  business_type text not null check (business_type in ('STUDENT_BUSINESS', 'OTHER_BUSINESS')),
  status text not null default 'DRAFT' check (
    status in ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED', 'SUSPENDED')
  ),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_applications_applicant_idx
  on public.seller_applications(applicant_id, created_at desc);

create index if not exists seller_applications_status_idx
  on public.seller_applications(status, created_at desc);

create index if not exists seller_applications_business_type_idx
  on public.seller_applications(business_type);

-- Avoid accumulating multiple unfinished drafts of the same type for one applicant.
create unique index if not exists seller_applications_unique_draft_per_type_idx
  on public.seller_applications(applicant_id, business_type)
  where status = 'DRAFT';

drop trigger if exists seller_applications_set_updated_at on public.seller_applications;
create trigger seller_applications_set_updated_at
before update on public.seller_applications
for each row
execute function public.set_updated_at();

alter table public.seller_applications enable row level security;

-- Direct Supabase access may only read the user's own applications.
-- Creation and updates are intentionally performed through the trusted Express API.
drop policy if exists "seller_applications_select_own" on public.seller_applications;
create policy "seller_applications_select_own"
on public.seller_applications
for select
to authenticated
using ((select auth.uid()) = applicant_id);

comment on table public.seller_applications is
  'Seller onboarding and approval records. Drafts are created before verification/business details are completed.';
