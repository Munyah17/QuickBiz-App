-- Assets module: fixed assets (equipment, computers, furniture — not
-- vehicles, which get their own Fleet module next to avoid overlap) with
-- straight-line depreciation and a maintenance log. Depreciated value is
-- computed on read (purchase_cost, useful_life_years, purchase_date), never
-- stored, so it can't drift out of sync with the passage of time itself.

insert into public.permissions (key, label, category) values
  ('assets.manage', 'Manage fixed assets', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'assets.manage'
on conflict do nothing;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  asset_number text not null,
  name text not null,
  category text not null default 'equipment' check (category in ('equipment', 'computer', 'furniture', 'other')),
  purchase_date date,
  purchase_cost numeric(12, 2) not null default 0,
  useful_life_years numeric(4, 1) not null default 5,
  status text not null default 'in_use' check (status in ('in_use', 'in_maintenance', 'disposed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, asset_number)
);

create index if not exists assets_org_id_idx on public.assets (org_id);

alter table public.assets enable row level security;

create trigger set_assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

create policy assets_select on public.assets
  for select using (org_id in (select public.user_org_ids()));

create policy assets_write on public.assets
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'assets.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'assets.manage'));

create trigger audit_assets
  after insert or update or delete on public.assets
  for each row execute function public.audit_trigger_with_module('assets');

create table if not exists public.asset_maintenance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  description text not null,
  cost numeric(12, 2) not null default 0,
  maintenance_date date not null default current_date,
  performed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists asset_maintenance_asset_id_idx on public.asset_maintenance (asset_id);

alter table public.asset_maintenance enable row level security;

create policy asset_maintenance_select on public.asset_maintenance
  for select using (org_id in (select public.user_org_ids()));

create policy asset_maintenance_write on public.asset_maintenance
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'assets.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'assets.manage'));
