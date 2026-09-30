-- Feature-depth pass: ZIMRA fiscalisation, loss control (expired/discarded
-- goods), manufacturing workshop job cards, and logistics distribution /
-- emergency incidents. Each table is org-scoped with the standard
-- user_org_ids() select policy + module.manage write policy.

-- ============================================================================
-- ZIMRA Fiscalisation (finance module)
-- Virtual fiscal devices registered with ZIMRA FDMS, the fiscalised receipts
-- they sign, and processed VAT returns.
-- ============================================================================
create table if not exists public.fiscal_devices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  device_serial text not null,
  device_model text,
  -- ZIMRA assigns a device ID + certificate on registration.
  zimra_device_id text,
  certificate_thumbprint text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  fiscal_day_number integer not null default 1,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, device_serial)
);
create index if not exists fiscal_devices_org_id_idx on public.fiscal_devices (org_id);
alter table public.fiscal_devices enable row level security;
-- 000044 already shipped fiscal_devices with a compliance-tracker schema.
-- The create-table above is a no-op there, so widen the existing table in
-- place: the virtual-device flow needs these columns, accepts 'suspended'
-- status, and doesn't populate the legacy NOT NULL device_type.
alter table public.fiscal_devices add column if not exists certificate_thumbprint text;
alter table public.fiscal_devices add column if not exists fiscal_day_number integer not null default 1;
alter table public.fiscal_devices add column if not exists last_sync_at timestamptz;
alter table public.fiscal_devices alter column device_type drop not null;
alter table public.fiscal_devices drop constraint if exists fiscal_devices_status_check;
alter table public.fiscal_devices add constraint fiscal_devices_status_check
  check (status in ('active', 'inactive', 'suspended', 'decommissioned', 'malfunctioning'));
-- Same-named policies exist from 000044 (tax_compliance.manage); replace them
-- accepting either permission so both the tracker and the fiscalisation UI work.
drop policy if exists fiscal_devices_select on public.fiscal_devices;
create policy fiscal_devices_select on public.fiscal_devices
  for select using (org_id in (select public.user_org_ids()));
drop policy if exists fiscal_devices_write on public.fiscal_devices;
create policy fiscal_devices_write on public.fiscal_devices
  for all using (
    org_id in (select public.user_org_ids())
    and (public.has_permission(org_id, 'finance.manage') or public.has_permission(org_id, 'tax_compliance.manage'))
  )
  with check (
    org_id in (select public.user_org_ids())
    and (public.has_permission(org_id, 'finance.manage') or public.has_permission(org_id, 'tax_compliance.manage'))
  );

create table if not exists public.fiscal_receipts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid references public.fiscal_devices(id) on delete set null,
  sales_invoice_id uuid references public.sales_invoices(id) on delete set null,
  receipt_number text not null,
  fiscal_day_number integer,
  receipt_total numeric(14, 2) not null default 0,
  vat_amount numeric(14, 2) not null default 0,
  -- ZIMRA returns a verification code + QR payload per fiscalised receipt.
  verification_code text,
  qr_data text,
  status text not null default 'fiscalised' check (status in ('fiscalised', 'pending', 'failed')),
  fiscalised_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (org_id, receipt_number)
);
create index if not exists fiscal_receipts_org_id_idx on public.fiscal_receipts (org_id);
alter table public.fiscal_receipts enable row level security;
create policy fiscal_receipts_select on public.fiscal_receipts
  for select using (org_id in (select public.user_org_ids()));
create policy fiscal_receipts_write on public.fiscal_receipts
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'));

create table if not exists public.vat_returns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  output_vat numeric(14, 2) not null default 0,  -- VAT charged on sales
  input_vat numeric(14, 2) not null default 0,   -- VAT paid on purchases
  net_vat numeric(14, 2) generated always as (output_vat - input_vat) stored,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'processed')),
  reference text,
  submitted_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vat_returns_org_id_idx on public.vat_returns (org_id);
alter table public.vat_returns enable row level security;
create policy vat_returns_select on public.vat_returns
  for select using (org_id in (select public.user_org_ids()));
create policy vat_returns_write on public.vat_returns
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'));

-- ============================================================================
-- Loss Control (inventory module) — expired, damaged, discarded or stolen
-- stock written off against a warehouse, with an approval trail.
-- ============================================================================
create table if not exists public.loss_control_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  quantity numeric(12, 2) not null,
  reason text not null default 'expired' check (reason in ('expired', 'damaged', 'discarded', 'theft', 'other')),
  unit_cost numeric(14, 2) not null default 0,
  total_value numeric(14, 2) generated always as (quantity * unit_cost) stored,
  status text not null default 'recorded' check (status in ('recorded', 'approved', 'written_off')),
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists loss_control_records_org_id_idx on public.loss_control_records (org_id);
alter table public.loss_control_records enable row level security;
create policy loss_control_records_select on public.loss_control_records
  for select using (org_id in (select public.user_org_ids()));
create policy loss_control_records_write on public.loss_control_records
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'inventory.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'inventory.manage'));

-- ============================================================================
-- Workshop (manufacturing module) — job cards for the workshop floor, linked
-- optionally to a work order.
-- ============================================================================
create table if not exists public.workshop_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  job_number text not null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  product_name text,
  description text,
  technician_id uuid references public.employees(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'on_hold', 'completed')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (org_id, job_number)
);
create index if not exists workshop_jobs_org_id_idx on public.workshop_jobs (org_id);
alter table public.workshop_jobs enable row level security;
create policy workshop_jobs_select on public.workshop_jobs
  for select using (org_id in (select public.user_org_ids()));
create policy workshop_jobs_write on public.workshop_jobs
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'manufacturing.manage'));

-- ============================================================================
-- Logistics depth — distribution routes and emergency incidents. Live
-- tracking and transit reuse the existing shipments + shipment_events tables.
-- ============================================================================
create table if not exists public.distribution_routes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  route_name text not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.employees(id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  scheduled_date date,
  stops jsonb not null default '[]',  -- ordered list of delivery stops
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists distribution_routes_org_id_idx on public.distribution_routes (org_id);
alter table public.distribution_routes enable row level security;
create policy distribution_routes_select on public.distribution_routes
  for select using (org_id in (select public.user_org_ids()));
create policy distribution_routes_write on public.distribution_routes
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'logistics.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'logistics.manage'));

create table if not exists public.emergency_incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  incident_number text not null,
  shipment_id uuid references public.shipments(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  type text not null default 'other' check (type in ('breakdown', 'accident', 'theft', 'delay', 'other')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  location text,
  description text,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, incident_number)
);
create index if not exists emergency_incidents_org_id_idx on public.emergency_incidents (org_id);
alter table public.emergency_incidents enable row level security;
create policy emergency_incidents_select on public.emergency_incidents
  for select using (org_id in (select public.user_org_ids()));
create policy emergency_incidents_write on public.emergency_incidents
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'logistics.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'logistics.manage'));
