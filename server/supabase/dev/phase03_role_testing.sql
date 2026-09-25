-- DEVELOPMENT ONLY: use these examples to grant roles while testing Phase 03.
-- Replace the UUID with a real user id from Supabase Authentication > Users.
-- Do not build a client-facing role assignment feature around these statements.

-- Grant admin for development:
-- insert into public.user_roles (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'ADMIN')
-- on conflict (user_id, role) do nothing;

-- Grant seller for development:
-- insert into public.user_roles (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'SELLER')
-- on conflict (user_id, role) do nothing;

-- Inspect roles:
select ur.user_id, u.email, ur.role, ur.granted_at
from public.user_roles ur
join auth.users u on u.id = ur.user_id
order by u.email, ur.role;
