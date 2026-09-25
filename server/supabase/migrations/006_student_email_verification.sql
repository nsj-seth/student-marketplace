-- Phase 05B: Student email verification.
-- Verification belongs to a seller application and is owned by the applicant.

create table if not exists public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  seller_application_id uuid not null unique references public.seller_applications(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete restrict,
  student_email text not null,
  status text not null default 'UNVERIFIED' check (
    status in ('UNVERIFIED', 'VERIFIED', 'FAILED')
  ),
  verification_method text not null default 'EMAIL_CODE' check (
    verification_method in ('EMAIL_CODE')
  ),
  code_hash text,
  code_expires_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_sent_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_verifications_applicant_idx
  on public.student_verifications(applicant_id, created_at desc);

create index if not exists student_verifications_status_idx
  on public.student_verifications(status, created_at desc);

create index if not exists student_verifications_university_idx
  on public.student_verifications(university_id);

create unique index if not exists student_verifications_verified_identity_idx
  on public.student_verifications(applicant_id, university_id, lower(student_email))
  where status = 'VERIFIED';

drop trigger if exists student_verifications_set_updated_at on public.student_verifications;
create trigger student_verifications_set_updated_at
before update on public.student_verifications
for each row
execute function public.set_updated_at();

alter table public.student_verifications enable row level security;

drop policy if exists "student_verifications_select_own" on public.student_verifications;
create policy "student_verifications_select_own"
on public.student_verifications
for select
to authenticated
using ((select auth.uid()) = applicant_id);

comment on table public.student_verifications is
  'Proof that a seller applicant controls a student email address associated with a selected university.';
