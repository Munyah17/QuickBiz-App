-- Module activation architecture (spec §8/§42). module_catalog is global
-- reference data (ships with the platform); org_modules records what each
-- tenant has actually installed/enabled. No module implementations exist yet
-- in this foundation build — "core" is implicit and always on, not a row.

create table if not exists public.module_catalog (
  key text primary key,
  name text not null,
  description text not null,
  category text not null
);

insert into public.module_catalog (key, name, description, category) values
  ('sales', 'Sales', 'Customers, quotations, sales orders, invoices, payments', 'sales'),
  ('pos', 'Point of Sale', 'Cashiers, registers, sessions, receipts, returns', 'sales'),
  ('inventory', 'Inventory', 'Products, warehouses, stock, transfers, adjustments', 'operations'),
  ('purchasing', 'Purchasing', 'Suppliers, purchase orders, goods received', 'operations'),
  ('finance', 'Finance', 'Chart of accounts, general ledger, cashbook, reconciliation', 'finance'),
  ('crm', 'CRM', 'Leads, opportunities, activities, campaigns', 'sales'),
  ('hr', 'HR', 'Employees, attendance, leave, payroll', 'people'),
  ('manufacturing', 'Manufacturing', 'Bills of materials, work orders, production planning', 'operations'),
  ('projects', 'Projects', 'Projects, tasks, milestones, timesheets', 'operations'),
  ('assets', 'Assets', 'Fixed assets, maintenance, depreciation', 'operations'),
  ('service_management', 'Service Management', 'Tickets, service requests, SLAs, warranty', 'operations'),
  ('fleet', 'Fleet', 'Vehicles, drivers, fuel, maintenance', 'operations'),
  ('documents', 'Document Management', 'Documents, folders, versions, approvals', 'platform'),
  ('marketing', 'Marketing', 'Campaigns, SMS, email, WhatsApp, loyalty', 'sales'),
  ('reporting', 'Reporting / BI', 'Custom dashboards, KPIs, scheduled reports', 'platform'),
  ('ecommerce', 'Ecommerce', 'Online products, orders, delivery sync', 'sales')
on conflict (key) do nothing;

alter table public.module_catalog enable row level security;

create policy module_catalog_select on public.module_catalog
  for select to authenticated using (true);

create table if not exists public.org_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  module_key text not null references public.module_catalog(key) on delete cascade,
  status text not null default 'available' check (status in ('available', 'enabled', 'disabled', 'configuration_required')),
  enabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, module_key)
);

create index if not exists org_modules_org_id_idx on public.org_modules (org_id);

alter table public.org_modules enable row level security;

create trigger set_org_modules_updated_at
  before update on public.org_modules
  for each row execute function public.set_updated_at();

create policy org_modules_select on public.org_modules
  for select using (org_id in (select public.user_org_ids()));

create policy org_modules_write on public.org_modules
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'modules.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'modules.manage'));
