-- Fleet module: vehicles + fuel logs. Drivers are not a separate table —
-- they're the existing Employee entity (spec §7 single-source-of-truth: one
-- employee record reused across HR/Fleet/Projects, not duplicated per
-- module). Routes/tracking-device integration (spec's fuller list) are
-- future work.

insert into public.permissions (key, label, category) values
  ('fleet.manage', 'Manage vehicles and fuel logs', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'fleet.manage'
on conflict do nothing;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  driver_id uuid references public.employees(id) on delete set null,
  registration_number text not null,
  make text,
  model text,
  year integer,
  status text not null default 'active' check (status in ('active', 'in_maintenance', 'inactive')),
  odometer_km numeric(10, 1) not null default 0,
  insurance_expiry date,
  license_expiry date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, registration_number)
);

create index if not exists vehicles_org_id_idx on public.vehicles (org_id);

alter table public.vehicles enable row level security;

create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create policy vehicles_select on public.vehicles
  for select using (org_id in (select public.user_org_ids()));

create policy vehicles_write on public.vehicles
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'fleet.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'fleet.manage'));

create trigger audit_vehicles
  after insert or update or delete on public.vehicles
  for each row execute function public.audit_trigger_with_module('fleet');

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  liters numeric(8, 2) not null,
  cost numeric(10, 2) not null,
  odometer_km numeric(10, 1),
  fuel_date date not null default current_date,
  recorded_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists fuel_logs_vehicle_id_idx on public.fuel_logs (vehicle_id);

alter table public.fuel_logs enable row level security;

create policy fuel_logs_select on public.fuel_logs
  for select using (org_id in (select public.user_org_ids()));

create policy fuel_logs_write on public.fuel_logs
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'fleet.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'fleet.manage'));
