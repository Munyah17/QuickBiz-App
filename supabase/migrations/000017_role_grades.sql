-- Replaces the flat Owner/Admin/Manager/Staff system roles with a graded
-- hierarchy (Owner -> Director -> Manager -> Team Leader -> Specialist ->
-- General) that maps to authority level, not job title. A construction firm
-- can rename "Team Leader" to "Foreman", a school to "Instructor", a factory
-- can keep "Team Leader" — the underlying permission grade never changes.
-- This keeps the platform industry-agnostic (spec's own "adapt the ERP to
-- your business" principle) instead of hardcoding industry-specific titles
-- as system roles.
alter table public.roles add column display_name text;

comment on column public.roles.display_name is
  'Org-chosen label shown in the UI instead of the system role name (e.g. "Foreman" instead of "Team Leader"). Null = show the default name.';

-- Redefine create_organization() (originally 000012, subscription logic
-- added in 000014) to seed the six graded roles instead of four. Only the
-- top three grades carry any permissions today (org.manage/branches.manage/
-- users.manage/settings.manage/audit.view/modules.manage/roles.manage cover
-- platform-core administration only) — Team Leader/Specialist/General exist
-- as real, assignable grades now so future business modules have somewhere
-- to attach their own permission keys without another role migration.
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
  v_role_director uuid;
  v_role_manager uuid;
  v_role_team_leader uuid;
  v_role_specialist uuid;
  v_role_general uuid;
  v_starter_plan_id uuid;
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
    (v_org_id, 'director', 'Director', true) returning id into v_role_director;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'manager', 'Manager', true) returning id into v_role_manager;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'team_leader', 'Team Leader', true) returning id into v_role_team_leader;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'specialist', 'Specialist', true) returning id into v_role_specialist;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'general', 'General', true) returning id into v_role_general;

  -- Owner: every platform permission (org creator, bootstrap role).
  insert into public.role_permissions (role_id, permission_id)
  select v_role_owner, id from public.permissions;

  -- Director: org-wide administration, excluding the two most structural
  -- levers (restructuring roles themselves, changing module/plan activation).
  insert into public.role_permissions (role_id, permission_id)
  select v_role_director, id from public.permissions
  where key in ('org.manage', 'branches.manage', 'users.manage', 'settings.manage', 'audit.view');

  -- Manager: day-to-day operational management.
  insert into public.role_permissions (role_id, permission_id)
  select v_role_manager, id from public.permissions
  where key in ('branches.manage', 'users.manage', 'audit.view');

  -- Team Leader: visibility into their scope, no platform-core management yet.
  insert into public.role_permissions (role_id, permission_id)
  select v_role_team_leader, id from public.permissions
  where key in ('audit.view');

  -- Specialist / General: no platform-core permissions — future business
  -- modules (inventory, sales, timesheets, ...) will grant permissions at
  -- these grades once they exist.

  insert into public.user_roles (org_member_id, role_id) values (v_member_id, v_role_owner);

  -- No trial: a new org starts 'pending' (payment required) — see the
  -- status check constraint comment in 000014_billing.sql.
  select id into v_starter_plan_id from public.plans where key = 'starter';
  insert into public.org_subscriptions (org_id, plan_id, status)
  values (v_org_id, v_starter_plan_id, 'pending');

  insert into public.notifications (org_id, user_id, title, body, type)
  values (v_org_id, auth.uid(), 'Welcome to QuickBiz', p_name || ' is ready to go. Complete billing setup to activate your subscription.', 'success');

  return v_org_id;
end;
$$;
