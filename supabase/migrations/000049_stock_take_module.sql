-- Stock Take Module: physical inventory counting and reconciliation.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('stock_take', 'Stock Take & Inventory Count', 'Physical inventory counting and reconciliation. Schedule stock takes, record counts, identify variances, and automatically adjust inventory levels with full audit trail.', 'inventory', 20)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('stock_take.manage', 'Manage stock takes and adjustments', 'inventory'),
  ('stock_take.execute', 'Execute physical counts', 'inventory'),
  ('stock_take.approve', 'Approve stock take results and adjustments', 'inventory'),
  ('stock_take.view', 'View stock take records', 'inventory')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('stock_take.manage', 'stock_take.execute', 'stock_take.approve', 'stock_take.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('stock_take.execute', 'stock_take.view')
on conflict do nothing;

create table if not exists public.stock_takes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  stock_take_number text not null unique,
  title text not null,
  description text,
  scheduled_date date not null,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled', 'under_review')),
  count_type text not null check (count_type in ('full', 'partial', 'cycle', 'spot')),
  total_items_expected int,
  total_items_counted int,
  total_variance_value numeric(18, 2),
  currency text not null default 'USD',
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_takes_org_id_idx on public.stock_takes (org_id);
create index if not exists stock_takes_warehouse_id_idx on public.stock_takes (warehouse_id);
create index if not exists stock_takes_status_idx on public.stock_takes (status);
create index if not exists stock_takes_scheduled_date_idx on public.stock_takes (scheduled_date);

alter table public.stock_takes enable row level security;

create policy stock_takes_select on public.stock_takes
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy stock_takes_insert on public.stock_takes
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'stock_take.manage'));

create policy stock_takes_update on public.stock_takes
  for update to authenticated
  using (
    org_id in (select public.user_org_ids())
    and (
      public.has_permission(org_id, 'stock_take.manage')
      or public.has_permission(org_id, 'stock_take.execute')
      or public.has_permission(org_id, 'stock_take.approve')
    )
  );

create trigger set_stock_takes_updated_at
  before update on public.stock_takes
  for each row execute function public.set_updated_at();

create table if not exists public.stock_take_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  stock_take_id uuid not null references public.stock_takes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  bin_id uuid references public.warehouse_bins(id) on delete set null,
  sku_code text,
  product_name text not null,
  system_quantity numeric(12, 3) not null,
  counted_quantity numeric(12, 3),
  variance numeric(12, 3),
  unit_cost numeric(12, 2),
  variance_value numeric(12, 2),
  count_status text not null default 'pending' check (count_status in ('pending', 'counted', 'verified', 'discrepancy')),
  counted_by uuid references public.profiles(id) on delete set null,
  counted_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_take_lines_stock_take_id_idx on public.stock_take_lines (stock_take_id);
create index if not exists stock_take_lines_product_id_idx on public.stock_take_lines (product_id);
create index if not exists stock_take_lines_count_status_idx on public.stock_take_lines (count_status);

alter table public.stock_take_lines enable row level security;

create policy stock_take_lines_select on public.stock_take_lines
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy stock_take_lines_write on public.stock_take_lines
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'stock_take.execute'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'stock_take.execute'));

create trigger set_stock_take_lines_updated_at
  before update on public.stock_take_lines
  for each row execute function public.set_updated_at();

create table if not exists public.stock_take_adjustments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  stock_take_line_id uuid not null references public.stock_take_lines(id) on delete cascade,
  stock_take_id uuid not null references public.stock_takes(id) on delete cascade,
  adjustment_type text not null check (adjustment_type in ('increase', 'decrease', 'no_change')),
  quantity_before numeric(12, 3) not null,
  quantity_after numeric(12, 3) not null,
  adjustment_quantity numeric(12, 3) not null,
  unit_cost numeric(12, 2),
  adjustment_value numeric(12, 2),
  reason text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists stock_take_adjustments_stock_take_id_idx on public.stock_take_adjustments (stock_take_id);

alter table public.stock_take_adjustments enable row level security;

create policy stock_take_adjustments_select on public.stock_take_adjustments
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

-- RPC functions

create or replace function public.create_stock_take(p_org_id uuid, p_title text, p_scheduled_date date, p_count_type text, p_warehouse_id uuid default null, p_branch_id uuid default null, p_description text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_take_id uuid;
  v_stock_take_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'stock_take.manage') then
    raise exception 'insufficient permissions';
  end if;

  v_stock_take_number := 'STK-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.stock_takes (org_id, warehouse_id, branch_id, stock_take_number, title, description, scheduled_date, count_type, created_by)
  values (p_org_id, p_warehouse_id, p_branch_id, v_stock_take_number, p_title, p_description, p_scheduled_date, p_count_type, auth.uid())
  returning id into v_stock_take_id;

  return v_stock_take_id;
end;
$$;

create or replace function public.start_stock_take(p_stock_take_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.stock_takes where id = p_stock_take_id;

  if v_org_id is null then
    raise exception 'Stock take not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'stock_take.execute') then
    raise exception 'insufficient permissions';
  end if;

  update public.stock_takes
  set status = 'in_progress', started_at = now()
  where id = p_stock_take_id;
end;
$$;

create or replace function public.add_stock_take_line(p_stock_take_id uuid, p_product_name text, p_system_quantity numeric, p_product_id uuid default null, p_warehouse_id uuid default null, p_bin_id uuid default null, p_sku_code text default null, p_unit_cost numeric default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_line_id uuid;
begin
  select org_id into v_org_id from public.stock_takes where id = p_stock_take_id;

  if v_org_id is null then
    raise exception 'Stock take not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'stock_take.execute') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.stock_take_lines (org_id, stock_take_id, product_id, warehouse_id, bin_id, sku_code, product_name, system_quantity, unit_cost)
  values (v_org_id, p_stock_take_id, p_product_id, p_warehouse_id, p_bin_id, p_sku_code, p_product_name, p_system_quantity, p_unit_cost)
  returning id into v_line_id;

  return v_line_id;
end;
$$;

create or replace function public.record_count(p_stock_take_line_id uuid, p_counted_quantity numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_system_quantity numeric;
  v_variance numeric;
  v_variance_value numeric;
  v_unit_cost numeric;
begin
  select org_id, system_quantity, unit_cost into v_org_id, v_system_quantity, v_unit_cost from public.stock_take_lines where id = p_stock_take_line_id;

  if v_org_id is null then
    raise exception 'Stock take line not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'stock_take.execute') then
    raise exception 'insufficient permissions';
  end if;

  v_variance := p_counted_quantity - v_system_quantity;
  v_variance_value := v_variance * coalesce(v_unit_cost, 0);

  update public.stock_take_lines
  set
    counted_quantity = p_counted_quantity,
    variance = v_variance,
    variance_value = v_variance_value,
    count_status = case when v_variance = 0 then 'verified' else 'discrepancy' end,
    counted_by = auth.uid(),
    counted_at = now()
  where id = p_stock_take_line_id;
end;
$$;

create or replace function public.complete_stock_take(p_stock_take_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_total_variance numeric;
begin
  select org_id into v_org_id from public.stock_takes where id = p_stock_take_id;

  if v_org_id is null then
    raise exception 'Stock take not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'stock_take.execute') then
    raise exception 'insufficient permissions';
  end if;

  select coalesce(sum(variance_value), 0) into v_total_variance
  from public.stock_take_lines
  where stock_take_id = p_stock_take_id;

  update public.stock_takes
  set
    status = 'completed',
    completed_at = now(),
    total_variance_value = v_total_variance
  where id = p_stock_take_id;
end;
$$;

create or replace function public.approve_stock_take(p_stock_take_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.stock_takes where id = p_stock_take_id;

  if v_org_id is null then
    raise exception 'Stock take not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'stock_take.approve') then
    raise exception 'insufficient permissions';
  end if;

  update public.stock_takes
  set
    status = 'under_review',
    approved_by = auth.uid(),
    approved_at = now()
  where id = p_stock_take_id;

  insert into public.stock_take_adjustments (org_id, stock_take_line_id, stock_take_id, adjustment_type, quantity_before, quantity_after, adjustment_quantity, unit_cost, adjustment_value, reason, approved_by)
  select
    stl.org_id,
    stl.id,
    stl.stock_take_id,
    case when stl.variance > 0 then 'increase' when stl.variance < 0 then 'decrease' else 'no_change' end,
    stl.system_quantity,
    stl.counted_quantity,
    stl.variance,
    stl.unit_cost,
    stl.variance_value,
    'Stock take variance adjustment',
    auth.uid()
  from public.stock_take_lines stl
  where stl.stock_take_id = p_stock_take_id
    and stl.variance != 0;
end;
$$;

create or replace function public.list_stock_takes(p_org_id uuid, p_status text default null, p_limit int default 50)
returns table (
  id uuid,
  stock_take_number text,
  title text,
  scheduled_date date,
  status text,
  count_type text,
  total_variance_value numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'stock_take.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select id, stock_take_number, title, scheduled_date, status, count_type, total_variance_value
  from public.stock_takes
  where org_id = p_org_id
    and (p_status is null or status = p_status)
  order by scheduled_date desc
  limit p_limit;
end;
$$;
