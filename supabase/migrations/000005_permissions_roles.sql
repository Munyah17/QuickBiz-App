-- RBAC: a global permission catalog, per-org roles (system roles are cloned
-- into every org by create_organization(), see 000012), and the join tables
-- connecting members to roles to permissions.

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  category text not null
);

-- System permission catalog. Reference data shipped with every environment.
insert into public.permissions (key, label, category) values
  ('org.manage', 'Manage organization profile', 'core'),
  ('branches.manage', 'Manage branches and departments', 'core'),
  ('users.manage', 'Manage users and invitations', 'core'),
  ('roles.manage', 'Manage roles and permissions', 'core'),
  ('modules.manage', 'Manage module activation', 'core'),
  ('settings.manage', 'Manage organization settings', 'core'),
  ('audit.view', 'View audit logs', 'core')
on conflict (key) do nothing;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, key)
);

create index if not exists roles_org_id_idx on public.roles (org_id);

alter table public.roles enable row level security;

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

alter table public.role_permissions enable row level security;

create table if not exists public.user_roles (
  org_member_id uuid not null references public.org_members(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (org_member_id, role_id)
);

alter table public.user_roles enable row level security;

-- ---------------------------------------------------------------------------
-- Permission-check helper, now that roles/permissions exist.
-- ---------------------------------------------------------------------------

create or replace function public.has_permission(target_org_id uuid, perm_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members m
    join public.user_roles ur on ur.org_member_id = m.id
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.user_id = auth.uid()
      and m.org_id = target_org_id
      and m.status = 'active'
      and p.key = perm_key
  );
$$;

-- Permissions catalog is global reference data: any authenticated user may read it.
create policy permissions_select on public.permissions
  for select to authenticated using (true);

create policy roles_select on public.roles
  for select using (org_id in (select public.user_org_ids()));

create policy roles_write on public.roles
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'roles.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'roles.manage'));

create policy role_permissions_select on public.role_permissions
  for select using (
    role_id in (select id from public.roles where org_id in (select public.user_org_ids()))
  );

create policy role_permissions_write on public.role_permissions
  for all using (
    role_id in (
      select id from public.roles
      where org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'roles.manage')
    )
  )
  with check (
    role_id in (
      select id from public.roles
      where org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'roles.manage')
    )
  );

create policy user_roles_select on public.user_roles
  for select using (
    org_member_id in (select id from public.org_members where org_id in (select public.user_org_ids()))
  );

create policy user_roles_write on public.user_roles
  for all using (
    org_member_id in (
      select id from public.org_members
      where org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'users.manage')
    )
  )
  with check (
    org_member_id in (
      select id from public.org_members
      where org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'users.manage')
    )
  );

-- ---------------------------------------------------------------------------
-- Tighten the loose member-scoped policies from 000004 now that has_permission()
-- exists: writes on organizations/branches/departments/org_members require the
-- relevant permission instead of just active membership.
-- ---------------------------------------------------------------------------

drop policy organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update using (public.is_org_member(id) and public.has_permission(id, 'org.manage'))
  with check (public.is_org_member(id) and public.has_permission(id, 'org.manage'));

drop policy branches_write on public.branches;
create policy branches_write on public.branches
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'branches.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'branches.manage'));

drop policy departments_write on public.departments;
create policy departments_write on public.departments
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'branches.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'branches.manage'));

drop policy org_members_update on public.org_members;
create policy org_members_update on public.org_members
  for update using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'users.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'users.manage'));
