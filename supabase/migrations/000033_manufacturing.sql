-- Manufacturing module: bills of materials + work orders. Reuses the
-- canonical Product entity for both finished goods and components (spec's
-- single-source-of-truth rule — no separate "manufacturing item" table),
-- and completing a work order moves real stock through the existing
-- inventory primitives (stock_levels/stock_movements), not a parallel
-- manufacturing-only ledger.

insert into public.permissions (key, label, category) values
  ('manufacturing.manage', 'Manage bills of materials and work orders', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'manufacturing.manage'
on conflict do nothing;

alter table public.stock_movements drop constraint stock_movements_reason_check;
alter table public.stock_movements add constraint stock_movements_reason_check
  check (reason in ('adjustment', 'sale', 'purchase', 'transfer_in', 'transfer_out', 'production_consume', 'production_output'));

create table if not exists public.bill_of_materials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bill_of_materials_org_id_idx on public.bill_of_materials (org_id);
create index if not exists bill_of_materials_product_id_idx on public.bill_of_materials (product_id);

alter table public.bill_of_materials enable row level security;

create trigger set_bill_of_materials_updated_at
  before update on public.bill_of_materials
  for each row execute function public.set_updated_at();

create policy bill_of_materials_select on public.bill_of_materials
  for select using (org_id in (select public.user_org_ids()));

create policy bill_of_materials_write on public.bill_of_materials
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'));

create trigger audit_bill_of_materials
  after insert or update or delete on public.bill_of_materials
  for each row execute function public.audit_trigger_with_module('manufacturing');

create table if not exists public.bom_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  bom_id uuid not null references public.bill_of_materials(id) on delete cascade,
  component_product_id uuid not null references public.products(id) on delete restrict,
  quantity_per_unit numeric(12, 4) not null check (quantity_per_unit > 0),
  created_at timestamptz not null default now(),
  unique (bom_id, component_product_id)
);

create index if not exists bom_components_org_id_idx on public.bom_components (org_id);
create index if not exists bom_components_bom_id_idx on public.bom_components (bom_id);

alter table public.bom_components enable row level security;

create policy bom_components_select on public.bom_components
  for select using (org_id in (select public.user_org_ids()));

create policy bom_components_write on public.bom_components
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'));

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  bom_id uuid not null references public.bill_of_materials(id) on delete restrict,
  wo_number text not null,
  quantity_planned numeric(12, 2) not null check (quantity_planned > 0),
  quantity_produced numeric(12, 2) not null default 0,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  scheduled_date date,
  completed_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, wo_number)
);

create index if not exists work_orders_org_id_idx on public.work_orders (org_id);

alter table public.work_orders enable row level security;

create trigger set_work_orders_updated_at
  before update on public.work_orders
  for each row execute function public.set_updated_at();

create policy work_orders_select on public.work_orders
  for select using (org_id in (select public.user_org_ids()));

create policy work_orders_write on public.work_orders
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'));

create trigger audit_work_orders
  after insert or update or delete on public.work_orders
  for each row execute function public.audit_trigger_with_module('manufacturing');

-- Completing a work order is the one real cross-module write: it consumes
-- each BOM component's stock and produces the finished good's stock through
-- the same stock_levels/stock_movements tables Inventory uses, inside one
-- transaction so a partial consume can never happen.
create or replace function public.complete_work_order(p_org_id uuid, p_work_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wo record;
  v_bom record;
  v_component record;
  v_required numeric;
  v_available numeric;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'manufacturing.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_wo from public.work_orders where id = p_work_order_id and org_id = p_org_id for update;
  if v_wo is null then
    raise exception 'work order not found';
  end if;
  if v_wo.status not in ('planned', 'in_progress') then
    raise exception 'work order is already %', v_wo.status;
  end if;

  select * into v_bom from public.bill_of_materials where id = v_wo.bom_id;

  for v_component in select * from public.bom_components where bom_id = v_wo.bom_id loop
    v_required := v_component.quantity_per_unit * v_wo.quantity_planned;

    select coalesce(quantity_on_hand, 0) into v_available
    from public.stock_levels
    where product_id = v_component.component_product_id and warehouse_id = v_wo.warehouse_id;

    if coalesce(v_available, 0) < v_required then
      raise exception 'insufficient stock for component % (need %, have %)', v_component.component_product_id, v_required, coalesce(v_available, 0);
    end if;

    insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
    values (p_org_id, v_component.component_product_id, v_wo.warehouse_id, -v_required)
    on conflict (product_id, warehouse_id)
    do update set quantity_on_hand = stock_levels.quantity_on_hand - v_required, updated_at = now();

    insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
    values (p_org_id, v_component.component_product_id, v_wo.warehouse_id, -v_required, 'production_consume', v_wo.wo_number, auth.uid());
  end loop;

  insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
  values (p_org_id, v_bom.product_id, v_wo.warehouse_id, v_wo.quantity_planned)
  on conflict (product_id, warehouse_id)
  do update set quantity_on_hand = stock_levels.quantity_on_hand + v_wo.quantity_planned, updated_at = now();

  insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
  values (p_org_id, v_bom.product_id, v_wo.warehouse_id, v_wo.quantity_planned, 'production_output', v_wo.wo_number, auth.uid());

  update public.work_orders
  set status = 'completed', quantity_produced = v_wo.quantity_planned, completed_at = now()
  where id = p_work_order_id;
end;
$$;
