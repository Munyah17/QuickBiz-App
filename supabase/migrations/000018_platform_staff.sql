-- Internal QuickBiz team roles — deliberately separate from tenant RBAC
-- (organizations/roles/org_members above). Platform staff are not members of
-- any tenant org; they operate the SaaS itself (support, sales, tenant
-- management). Mixing this into tenant-scoped `roles` would be a real
-- authorization hazard (a support rep could accidentally inherit
-- tenant-admin power over a customer's org) — confirmed against current
-- multi-tenant SaaS RBAC guidance before building this.
--
-- Authorization model: these tables carry RLS with ZERO policies, so even
-- though 000015_grants.sql's blanket GRANT technically covers them, ordinary
-- authenticated users get zero rows and no writes — enabled-RLS-with-no-
-- policies is a default-deny regardless of table grants. The only thing an
-- ordinary user can learn about this system is "am I platform staff and
-- what can I do" via the SECURITY DEFINER function below (needed so the app
-- can decide whether to show a staff-portal link at all). Every actual
-- backoffice query goes through the service-role client from
-- lib/platform-session.ts's requirePlatformStaff() guard, never the
-- ordinary authenticated client.

create table if not exists public.platform_roles (
  key text primary key,
  name text not null,
  description text not null
);

insert into public.platform_roles (key, name, description) values
  ('super_admin', 'Super Admin', 'Unrestricted platform access, including managing other staff accounts. Kept to an absolute minimum of people.'),
  ('admin', 'Admin', 'Manages tenants, plans, and the module catalog. Cannot manage other staff or platform-wide security settings.'),
  ('tech_support', 'Tech Support', 'Read-heavy access for troubleshooting tenant issues. No billing or destructive actions.'),
  ('sales', 'Sales', 'Sees account and subscription status only — no access to a tenant''s actual business data.')
on conflict (key) do nothing;

alter table public.platform_roles enable row level security;

create table if not exists public.platform_permissions (
  key text primary key,
  label text not null
);

insert into public.platform_permissions (key, label) values
  ('tenants.view', 'View tenants'),
  ('tenants.manage', 'Manage tenant status and plan'),
  ('staff.manage', 'Manage platform staff accounts'),
  ('billing.view', 'View subscription and billing status')
on conflict (key) do nothing;

alter table public.platform_permissions enable row level security;

create table if not exists public.platform_role_permissions (
  role_key text not null references public.platform_roles(key) on delete cascade,
  permission_key text not null references public.platform_permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

insert into public.platform_role_permissions (role_key, permission_key)
select 'super_admin', key from public.platform_permissions
on conflict do nothing;

insert into public.platform_role_permissions (role_key, permission_key) values
  ('admin', 'tenants.view'), ('admin', 'tenants.manage'), ('admin', 'billing.view'),
  ('tech_support', 'tenants.view'),
  ('sales', 'tenants.view'), ('sales', 'billing.view')
on conflict do nothing;

alter table public.platform_role_permissions enable row level security;

create table if not exists public.platform_staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role_key text not null references public.platform_roles(key),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_staff enable row level security;

create trigger set_platform_staff_updated_at
  before update on public.platform_staff
  for each row execute function public.set_updated_at();

-- The one self-check an ordinary user is allowed: "am I staff, what can I do."
create or replace function public.get_platform_staff_context()
returns table (role_key text, permission_keys text[])
language sql
security definer
stable
set search_path = public
as $$
  select ps.role_key, coalesce(array_agg(prp.permission_key) filter (where prp.permission_key is not null), '{}')
  from public.platform_staff ps
  left join public.platform_role_permissions prp on prp.role_key = ps.role_key
  where ps.user_id = auth.uid() and ps.status = 'active'
  group by ps.role_key;
$$;
