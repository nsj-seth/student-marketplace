-- Phase 07B: Public business storefront discovery.
-- Adds indexes used by public marketplace business browsing. The public read
-- policies were established when businesses were introduced in migration 008.

create index if not exists businesses_public_listing_idx
  on public.businesses(status, availability_status, approved_at desc);

create index if not exists businesses_public_university_idx
  on public.businesses(status, university_id, approved_at desc);

create index if not exists businesses_public_type_idx
  on public.businesses(status, business_type, approved_at desc);

comment on table public.businesses is
  'Approved marketplace businesses. Public endpoints expose only safe storefront fields for ACTIVE businesses.';
