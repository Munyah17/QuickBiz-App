-- Logistics module: shipments/deliveries tracking. Reuses the canonical
-- Customer, Vehicle (Fleet), and Employee entities rather than duplicating
-- them, and optionally links to the Sales invoice or Ecommerce online order
-- a shipment is fulfilling — a delivery is a fact about an existing sale,
-- not a separate record of it.

insert into public.permissions (key, label, category) values
  ('logistics.manage', 'Manage shipments and deliveries', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'logistics.manage'
on conflict do nothing;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  sales_invoice_id uuid references public.sales_invoices(id) on delete set null,
  online_order_id uuid references public.online_orders(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.employees(id) on delete set null,
  shipment_number text not null,
  carrier text,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned')),
  delivery_address text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, shipment_number)
);

create index if not exists shipments_org_id_idx on public.shipments (org_id);

alter table public.shipments enable row level security;

create trigger set_shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

create policy shipments_select on public.shipments
  for select using (org_id in (select public.user_org_ids()));

create policy shipments_write on public.shipments
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'logistics.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'logistics.manage'));

create trigger audit_shipments
  after insert or update or delete on public.shipments
  for each row execute function public.audit_trigger_with_module('logistics');

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('logistics', 'Logistics', 'Shipments, deliveries, carriers, and dispatch tracking', 'operations', 15)
on conflict (key) do nothing;
