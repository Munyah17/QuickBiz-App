-- Bootstrap RPCs. A brand-new authenticated user has no org_members row yet,
-- so RLS grants them nothing — org creation (and member invitation, which
-- requires a permission check no ordinary insert policy can express cleanly)
-- must happen through SECURITY DEFINER functions instead of direct table
-- writes from the client.

create or replace function public.create_organization(p_name text, p_branch_name text default 'Head Office')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_branch_id uuid;
  v_member_id uuid;
  v_role_owner uuid;
  v_role_admin uuid;
  v_role_manager uuid;
  v_role_staff uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  insert into public.organizations (name) values (p_name) returning id into v_org_id;

  insert into public.branches (org_id, name, type)
  values (v_org_id, p_branch_name, 'head_office')
  returning id into v_branch_id;

  insert into public.org_members (org_id, user_id, branch_id, status)
  values (v_org_id, auth.uid(), v_branch_id, 'active')
  returning id into v_member_id;

  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'owner', 'Owner', true) returning id into v_role_owner;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'admin', 'Admin', true) returning id into v_role_admin;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'manager', 'Manager', true) returning id into v_role_manager;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'staff', 'Staff', true) returning id into v_role_staff;

  -- Owner and Admin: every platform permission.
  insert into public.role_permissions (role_id, permission_id)
  select v_role_owner, id from public.permissions;
  insert into public.role_permissions (role_id, permission_id)
  select v_role_admin, id from public.permissions;

  -- Manager: day-to-day operational management, no roles/permissions authoring.
  insert into public.role_permissions (role_id, permission_id)
  select v_role_manager, id from public.permissions
  where key in ('branches.manage', 'users.manage', 'audit.view');

  -- Staff: no management permissions (read-only via the base select policies).

  insert into public.user_roles (org_member_id, role_id) values (v_member_id, v_role_owner);

  insert into public.notifications (org_id, user_id, title, body, type)
  values (v_org_id, auth.uid(), 'Welcome to QuickBiz', p_name || ' is ready to go.', 'success');

  return v_org_id;
end;
$$;

create or replace function public.invite_org_member(
  p_org_id uuid,
  p_user_id uuid,
  p_role_key text,
  p_branch_id uuid default null,
  p_department_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_role_id uuid;
  v_org_name text;
begin
  if not public.has_permission(p_org_id, 'users.manage') then
    raise exception 'permission denied';
  end if;

  select id into v_role_id from public.roles where org_id = p_org_id and key = p_role_key;
  if v_role_id is null then
    raise exception 'unknown role %', p_role_key;
  end if;

  insert into public.org_members (org_id, user_id, branch_id, department_id, status)
  values (p_org_id, p_user_id, p_branch_id, p_department_id, 'active')
  on conflict (org_id, user_id) do update set status = 'active'
  returning id into v_member_id;

  insert into public.user_roles (org_member_id, role_id)
  values (v_member_id, v_role_id)
  on conflict do nothing;

  select name into v_org_name from public.organizations where id = p_org_id;

  insert into public.notifications (org_id, user_id, title, body, type)
  values (p_org_id, p_user_id, 'You''ve joined ' || v_org_name, 'You now have access to ' || v_org_name || '.', 'info');

  return v_member_id;
end;
$$;

-- Convenience RPC for the app's UI-level permission gating (nav visibility,
-- disabled buttons). Real enforcement is the has_permission() checks baked
-- into the RLS policies above — this is defense-in-depth, not the boundary.
create or replace function public.get_user_permissions(target_org_id uuid)
returns setof text
language sql
security definer
stable
set search_path = public
as $$
  select distinct p.key
  from public.org_members m
  join public.user_roles ur on ur.org_member_id = m.id
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where m.user_id = auth.uid()
    and m.org_id = target_org_id
    and m.status = 'active';
$$;
