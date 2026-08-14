-- Billing structure: base platform subscription + per-module entitlement,
-- matching the recommendation captured in project memory (base fee tied to
-- seats/branches, modules priced as add-ons, integration connectors bundled
-- separately once they exist). This is the DATA MODEL and entitlement layer
-- only — no payment gateway is wired up, so there is deliberately no
-- checkout/charge flow here (that would be fake functionality). Plan
-- changes are staff-assisted for now (contact sales), not self-serve.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  monthly_price_usd numeric(10, 2) not null default 0,
  included_seats integer not null,
  included_branches integer not null,
  is_active boolean not null default true
);

-- Priced against the accounting/ERP SaaS market (Zoho Books $20-275/mo, QuickBooks
-- Online $20-275/mo, Xero from $25/mo, Odoo from $31/user/mo) — QuickBiz sits
-- toward the middle of that range since a plan bundles a full multi-module
-- ERP, not just accounting. No free tier: every org is a paying subscription
-- from day one, matching the "no free stuff" business decision (2026-08-11).
insert into public.plans (key, name, description, monthly_price_usd, included_seats, included_branches) values
  ('starter', 'Starter', 'Core platform — tenancy, branches, users, roles, audit — for a single-location small business getting started.', 39, 3, 1),
  ('growth', 'Growth', 'Starter plus day-to-day operational modules for a growing, multi-branch SME.', 99, 10, 3),
  ('enterprise', 'Enterprise', 'Every module, unlimited seats and branches, priority support.', 299, 999, 999)
on conflict (key) do nothing;

alter table public.plans enable row level security;

create policy plans_select on public.plans
  for select to authenticated using (true);

create table if not exists public.plan_modules (
  plan_id uuid not null references public.plans(id) on delete cascade,
  module_key text not null references public.module_catalog(key) on delete cascade,
  primary key (plan_id, module_key)
);

insert into public.plan_modules (plan_id, module_key)
select p.id, m.key
from public.plans p
cross join public.module_catalog m
where p.key = 'enterprise';

insert into public.plan_modules (plan_id, module_key)
select p.id, m.key
from public.plans p
cross join public.module_catalog m
where p.key = 'growth' and m.key in ('sales', 'pos', 'inventory', 'purchasing', 'crm');

alter table public.plan_modules enable row level security;

create policy plan_modules_select on public.plan_modules
  for select to authenticated using (true);

create table if not exists public.org_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  -- No trial status by design (explicit business decision, 2026-08-11): a new
  -- org starts 'pending' (payment required, no active subscription) rather
  -- than an unearned free trial period. Prospects who want to try QuickBiz
  -- without paying use the separate, fully-mocked /demo experience instead —
  -- see the demo-mode memory note — never a real org with real access.
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.org_subscriptions enable row level security;

create trigger set_org_subscriptions_updated_at
  before update on public.org_subscriptions
  for each row execute function public.set_updated_at();

create policy org_subscriptions_select on public.org_subscriptions
  for select using (org_id in (select public.user_org_ids()));

-- No client-side write policy: plan assignment/changes happen through
-- create_organization() (redefined below) or a future staff/billing-admin tool.

-- Redefine create_organization() (originally 000012) to also enroll every new
-- org on the free Starter plan, now that org_subscriptions/plans exist.
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
    (v_org_id, 'admin', 'Admin', true) returning id into v_role_admin;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'manager', 'Manager', true) returning id into v_role_manager;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'staff', 'Staff', true) returning id into v_role_staff;

  insert into public.role_permissions (role_id, permission_id)
  select v_role_owner, id from public.permissions;
  insert into public.role_permissions (role_id, permission_id)
  select v_role_admin, id from public.permissions;

  insert into public.role_permissions (role_id, permission_id)
  select v_role_manager, id from public.permissions
  where key in ('branches.manage', 'users.manage', 'audit.view');

  insert into public.user_roles (org_member_id, role_id) values (v_member_id, v_role_owner);

  -- No payment gateway is wired up and no free access (not even a trial) is
  -- given — a new org starts 'pending' until payment is arranged. This
  -- version is superseded by 000017's redefinition (adds role grades); kept
  -- consistent here anyway since function bodies are visible in migration
  -- history even though this one is never actually invoked.
  select id into v_starter_plan_id from public.plans where key = 'starter';
  insert into public.org_subscriptions (org_id, plan_id, status)
  values (v_org_id, v_starter_plan_id, 'pending');

  insert into public.notifications (org_id, user_id, title, body, type)
  values (v_org_id, auth.uid(), 'Welcome to QuickBiz', p_name || ' is ready to go. Complete billing setup to activate your subscription.', 'success');

  return v_org_id;
end;
$$;
