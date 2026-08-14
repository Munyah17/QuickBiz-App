-- Billing model change (2026-08-13, explicit business decision — see project
-- memory): replaces the bundled Starter/Growth/Enterprise plans from 000014
-- with à la carte per-module pricing. "Clients will select only modules
-- they want" — each module now carries its own recurring price, and a
-- tenant's monthly bill is simply the sum of whatever they've enabled, plus
-- a one-time setup fee paid once at onboarding. No bundled tiers, no free
-- tier, no trial.

alter table public.module_catalog
  add column monthly_price_usd numeric(10, 2) not null default 0;

-- Priced individually so the sum across every module ($249/mo if a tenant
-- enabled all 16) stays in the same competitive range the old Enterprise
-- bundle was benchmarked against (Zoho Books/QuickBooks Online top tier
-- ~$275/mo) — see billing-model-options memory for the research this and
-- the setup fee below are grounded in.
update public.module_catalog set monthly_price_usd = case key
  when 'sales' then 15
  when 'pos' then 20
  when 'inventory' then 15
  when 'purchasing' then 12
  when 'finance' then 25
  when 'crm' then 12
  when 'hr' then 18
  when 'manufacturing' then 25
  when 'projects' then 15
  when 'assets' then 10
  when 'service_management' then 15
  when 'fleet' then 12
  when 'documents' then 8
  when 'marketing' then 12
  when 'reporting' then 15
  when 'ecommerce' then 20
  else monthly_price_usd
end;

-- One-time setup fee, global for now (not per-org/per-module) — a single-row
-- table rather than a hardcoded constant so staff can adjust it later
-- without a migration. The boolean primary key is the standard Postgres
-- "only one row, ever" trick.
create table if not exists public.billing_settings (
  id boolean primary key default true,
  setup_fee_usd numeric(10, 2) not null,
  constraint billing_settings_singleton check (id)
);

insert into public.billing_settings (id, setup_fee_usd) values (true, 149)
on conflict (id) do nothing;

alter table public.billing_settings enable row level security;

create policy billing_settings_select on public.billing_settings
  for select to authenticated using (true);

-- Billing now lives directly on organizations instead of a separate
-- subscriptions/plans join — there's no plan to reference anymore, just
-- "has the setup fee been paid" and "is the account in good standing"
-- (the recurring amount is derived by summing enabled modules' prices, not
-- stored). Drops the bundled-plan tables from 000014 entirely.
alter table public.organizations
  add column billing_status text not null default 'pending'
    check (billing_status in ('pending', 'active', 'past_due', 'cancelled')),
  add column setup_fee_paid boolean not null default false;

drop table if exists public.plan_modules;
drop table if exists public.org_subscriptions;
drop table if exists public.plans;

-- Redefine create_organization() once more: no plan/subscription insert at
-- all now — organizations.billing_status/setup_fee_paid default correctly
-- on their own. Everything else (role grades from 000017) is unchanged.
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

  insert into public.role_permissions (role_id, permission_id)
  select v_role_owner, id from public.permissions;

  insert into public.role_permissions (role_id, permission_id)
  select v_role_director, id from public.permissions
  where key in ('org.manage', 'branches.manage', 'users.manage', 'settings.manage', 'audit.view');

  insert into public.role_permissions (role_id, permission_id)
  select v_role_manager, id from public.permissions
  where key in ('branches.manage', 'users.manage', 'audit.view');

  insert into public.role_permissions (role_id, permission_id)
  select v_role_team_leader, id from public.permissions
  where key in ('audit.view');

  insert into public.user_roles (org_member_id, role_id) values (v_member_id, v_role_owner);

  insert into public.notifications (org_id, user_id, title, body, type)
  values (
    v_org_id, auth.uid(), 'Welcome to QuickBiz',
    p_name || ' is ready to go. Complete the one-time setup fee and enable the modules you need to activate billing.',
    'success'
  );

  return v_org_id;
end;
$$;
