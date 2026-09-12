-- Warehousing and Warehouse Management Module: zones, aisles, bins, bin-level
-- inventory placement, and inter-warehouse transfers on top of the existing
-- warehouses table.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('warehousing', 'Warehousing & Warehouse Management', 'Complete warehouse management with multi-location support, bin management, storage capacity tracking, and optimized inventory placement. Manage warehouses, zones, aisles, bins, and storage locations.', 'inventory', 30)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('warehousing.manage', 'Manage warehouses and locations', 'inventory'),
  ('warehousing.view', 'View warehouse operations', 'inventory'),
  ('warehousing.transfer', 'Manage inventory transfers between warehouses', 'inventory')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('warehousing.manage', 'warehousing.view', 'warehousing.transfer')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('warehousing.view', 'warehousing.transfer')
on conflict do nothing;

-- Enhance the existing warehouses table (from the foundation) for full
-- warehouse management.
alter table public.warehouses
  add column if not exists code text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text default 'Zimbabwe',
  add column if not exists manager_id uuid references public.profiles(id) on delete set null,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists total_area numeric(10, 2),
  add column if not exists area_unit text default 'sq_m',
  add column if not exists capacity_volume numeric(12, 2),
  add column if not exists volume_unit text default 'cubic_m',
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive', 'maintenance', 'closed')),
  add column if not exists is_primary boolean not null default false,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'warehouses_org_code_unique'
  ) then
    alter table public.warehouses add constraint warehouses_org_code_unique unique (org_id, code);
  end if;
end $$;

alter table public.warehouses alter column branch_id drop not null;

create index if not exists warehouses_org_id_idx on public.warehouses (org_id);
create index if not exists warehouses_branch_id_idx on public.warehouses (branch_id);
create index if not exists warehouses_status_idx on public.warehouses (status);

alter table public.warehouses enable row level security;

drop policy if exists warehouses_select on public.warehouses;
drop policy if exists warehouses_write on public.warehouses;

create policy warehouses_select on public.warehouses
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy warehouses_write on public.warehouses
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'));

create trigger set_warehouses_updated_at
  before update on public.warehouses
  for each row execute function public.set_updated_at();

create table if not exists public.warehouse_zones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  code text not null,
  name text not null,
  zone_type text check (zone_type in ('receiving', 'storage', 'picking', 'packing', 'shipping', 'quarantine', 'returns')),
  area numeric(10, 2),
  capacity_volume numeric(12, 2),
  temperature_controlled boolean not null default false,
  min_temp numeric,
  max_temp numeric,
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create index if not exists warehouse_zones_warehouse_id_idx on public.warehouse_zones (warehouse_id);

alter table public.warehouse_zones enable row level security;

create policy warehouse_zones_select on public.warehouse_zones
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy warehouse_zones_write on public.warehouse_zones
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'));

create trigger set_warehouse_zones_updated_at
  before update on public.warehouse_zones
  for each row execute function public.set_updated_at();

create table if not exists public.warehouse_aisles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  zone_id uuid not null references public.warehouse_zones(id) on delete cascade,
  code text not null,
  name text,
  length numeric(10, 2),
  width numeric(10, 2),
  aisle_type text check (aisle_type in ('standard', 'narrow', 'wide', 'drive_through')),
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, code)
);

create index if not exists warehouse_aisles_zone_id_idx on public.warehouse_aisles (zone_id);

alter table public.warehouse_aisles enable row level security;

create policy warehouse_aisles_select on public.warehouse_aisles
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy warehouse_aisles_write on public.warehouse_aisles
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'));

create trigger set_warehouse_aisles_updated_at
  before update on public.warehouse_aisles
  for each row execute function public.set_updated_at();

create table if not exists public.warehouse_bins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  aisle_id uuid references public.warehouse_aisles(id) on delete set null,
  zone_id uuid not null references public.warehouse_zones(id) on delete cascade,
  code text not null,
  name text,
  bin_type text check (bin_type in ('shelf', 'pallet', 'bin', 'rack', 'floor')),
  level int,
  position int,
  length numeric(8, 2),
  width numeric(8, 2),
  height numeric(8, 2),
  max_weight numeric(10, 2),
  current_weight numeric(10, 2) default 0,
  capacity_volume numeric(10, 2),
  status text not null default 'active' check (status in ('active', 'inactive', 'full', 'reserved', 'damaged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, code)
);

create index if not exists warehouse_bins_zone_id_idx on public.warehouse_bins (zone_id);
create index if not exists warehouse_bins_aisle_id_idx on public.warehouse_bins (aisle_id);

alter table public.warehouse_bins enable row level security;

create policy warehouse_bins_select on public.warehouse_bins
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy warehouse_bins_write on public.warehouse_bins
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'));

create trigger set_warehouse_bins_updated_at
  before update on public.warehouse_bins
  for each row execute function public.set_updated_at();

create table if not exists public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  bin_id uuid not null references public.warehouse_bins(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity numeric(12, 3) not null default 0,
  unit text,
  lot_number text,
  expiry_date date,
  received_date date,
  status text not null default 'in_stock' check (status in ('in_stock', 'reserved', 'quarantined', 'damaged', 'picked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_locations_warehouse_id_idx on public.inventory_locations (warehouse_id);
create index if not exists inventory_locations_bin_id_idx on public.inventory_locations (bin_id);
create index if not exists inventory_locations_product_id_idx on public.inventory_locations (product_id);

alter table public.inventory_locations enable row level security;

create policy inventory_locations_select on public.inventory_locations
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy inventory_locations_write on public.inventory_locations
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.manage'));

create trigger set_inventory_locations_updated_at
  before update on public.inventory_locations
  for each row execute function public.set_updated_at();

create table if not exists public.warehouse_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  transfer_number text not null unique,
  from_warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  to_warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  transfer_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'in_transit', 'received', 'cancelled')),
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists warehouse_transfers_org_id_idx on public.warehouse_transfers (org_id);
create index if not exists warehouse_transfers_from_warehouse_id_idx on public.warehouse_transfers (from_warehouse_id);
create index if not exists warehouse_transfers_to_warehouse_id_idx on public.warehouse_transfers (to_warehouse_id);
create index if not exists warehouse_transfers_status_idx on public.warehouse_transfers (status);

alter table public.warehouse_transfers enable row level security;

create policy warehouse_transfers_select on public.warehouse_transfers
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy warehouse_transfers_write on public.warehouse_transfers
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.transfer'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.transfer'));

create trigger set_warehouse_transfers_updated_at
  before update on public.warehouse_transfers
  for each row execute function public.set_updated_at();

create table if not exists public.warehouse_transfer_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  transfer_id uuid not null references public.warehouse_transfers(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  from_bin_id uuid references public.warehouse_bins(id) on delete set null,
  to_bin_id uuid references public.warehouse_bins(id) on delete set null,
  quantity numeric(12, 3) not null,
  unit text,
  lot_number text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists warehouse_transfer_lines_transfer_id_idx on public.warehouse_transfer_lines (transfer_id);

alter table public.warehouse_transfer_lines enable row level security;

create policy warehouse_transfer_lines_select on public.warehouse_transfer_lines
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy warehouse_transfer_lines_insert on public.warehouse_transfer_lines
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'warehousing.transfer'));

-- RPC functions

create or replace function public.create_warehouse(p_org_id uuid, p_code text, p_name text, p_address text default null, p_branch_id uuid default null, p_manager_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_warehouse_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.warehouses (org_id, code, name, address, branch_id, manager_id, created_by)
  values (p_org_id, p_code, p_name, p_address, p_branch_id, p_manager_id, auth.uid())
  returning id into v_warehouse_id;

  return v_warehouse_id;
end;
$$;

create or replace function public.create_warehouse_zone(p_warehouse_id uuid, p_code text, p_name text, p_zone_type text, p_area numeric default null, p_capacity_volume numeric default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_zone_id uuid;
begin
  select org_id into v_org_id from public.warehouses where id = p_warehouse_id;

  if v_org_id is null then
    raise exception 'Warehouse not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'warehousing.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.warehouse_zones (org_id, warehouse_id, code, name, zone_type, area, capacity_volume)
  values (v_org_id, p_warehouse_id, p_code, p_name, p_zone_type, p_area, p_capacity_volume)
  returning id into v_zone_id;

  return v_zone_id;
end;
$$;

create or replace function public.create_warehouse_bin(p_zone_id uuid, p_code text, p_name text default null, p_bin_type text default 'shelf', p_level int default null, p_position int default null, p_max_weight numeric default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_bin_id uuid;
begin
  select org_id into v_org_id from public.warehouse_zones where id = p_zone_id;

  if v_org_id is null then
    raise exception 'Zone not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'warehousing.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.warehouse_bins (org_id, zone_id, code, name, bin_type, level, position, max_weight)
  values (v_org_id, p_zone_id, p_code, p_name, p_bin_type, p_level, p_position, p_max_weight)
  returning id into v_bin_id;

  return v_bin_id;
end;
$$;

create or replace function public.place_inventory_in_bin(p_warehouse_id uuid, p_bin_id uuid, p_quantity numeric, p_product_id uuid default null, p_unit text default null, p_lot_number text default null, p_expiry_date date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_location_id uuid;
begin
  select org_id into v_org_id from public.warehouses where id = p_warehouse_id;

  if v_org_id is null then
    raise exception 'Warehouse not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'warehousing.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.inventory_locations (org_id, warehouse_id, bin_id, product_id, quantity, unit, lot_number, expiry_date, received_date)
  values (v_org_id, p_warehouse_id, p_bin_id, p_product_id, p_quantity, p_unit, p_lot_number, p_expiry_date, current_date)
  returning id into v_location_id;

  return v_location_id;
end;
$$;

create or replace function public.create_warehouse_transfer(p_org_id uuid, p_from_warehouse_id uuid, p_to_warehouse_id uuid, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transfer_id uuid;
  v_transfer_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.transfer') then
    raise exception 'insufficient permissions';
  end if;

  v_transfer_number := 'WHT-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.warehouse_transfers (org_id, transfer_number, from_warehouse_id, to_warehouse_id, notes, requested_by)
  values (p_org_id, v_transfer_number, p_from_warehouse_id, p_to_warehouse_id, p_notes, auth.uid())
  returning id into v_transfer_id;

  return v_transfer_id;
end;
$$;

create or replace function public.list_warehouses(p_org_id uuid, p_status text default null)
returns table (
  id uuid,
  code text,
  name text,
  city text,
  manager_name text,
  status text,
  is_primary boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    w.id,
    w.code,
    w.name,
    w.city,
    p.full_name as manager_name,
    w.status,
    w.is_primary
  from public.warehouses w
  left join public.profiles p on w.manager_id = p.id
  where w.org_id = p_org_id
    and (p_status is null or w.status = p_status)
  order by w.is_primary desc, w.name;
end;
$$;
