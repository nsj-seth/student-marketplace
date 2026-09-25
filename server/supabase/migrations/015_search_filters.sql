-- Phase 10: marketplace search/filter support.
-- Adds lightweight indexes that support the filters introduced in this phase.

create extension if not exists pg_trgm;

create index if not exists products_price_idx on public.products (price);
create index if not exists products_category_status_idx on public.products (category_id, status);
create index if not exists products_business_status_idx on public.products (business_id, status);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists products_description_trgm_idx on public.products using gin (description gin_trgm_ops);

create index if not exists businesses_public_filter_idx
  on public.businesses (status, business_type, availability_status, university_id);
create index if not exists businesses_name_trgm_idx on public.businesses using gin (name gin_trgm_ops);
create index if not exists businesses_description_trgm_idx on public.businesses using gin (description gin_trgm_ops);
create index if not exists businesses_location_trgm_idx on public.businesses using gin (location_text gin_trgm_ops);
