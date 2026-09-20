-- Module consolidation (2026-09-19, explicit product decision): the Module
-- Store had grown to 30 narrow modules, which overloaded the sidebar with
-- collapsible groups that mixed unrelated functions. Modules are now
-- consolidated so that each store entry is a coherent product area, and the
-- sidebar renders exactly one collapsible group per module whose links are
-- that module's functions.
--
-- Merge map (absorbed key -> surviving key):
--   purchasing, tender_bidding            -> sales              (Sales & Purchasing)
--   marketing, social_media               -> crm                (CRM & Marketing)
--   warehousing, stock_take               -> inventory          (Inventory)
--   payroll, disciplinary                 -> hr                 (HR & Payroll)
--   iban, tax_compliance                  -> finance            (Finance)
--   local_services                        -> service_management (Service Management)
--   fleet                                 -> logistics          (Logistics & Fleet)
--   sheq                                  -> risk_insurance     (Risk & Compliance)
--   reporting, email                      -> documents          (Documents & Reporting)
--
-- Surviving keys keep their existing monthly_price_usd — pricing for the
-- broadened modules is a separate business decision, not part of this
-- structural change.

-- 1. Rename/redescribe the surviving catalog entries.
update public.module_catalog set name = 'Sales & Purchasing',
  description = 'Customers, quotations, sales orders, invoices, payments, suppliers, purchase orders, goods received, tenders',
  category = 'sales'
where key = 'sales';

update public.module_catalog set name = 'CRM & Marketing',
  description = 'Leads, opportunities, campaigns, loyalty, social media',
  category = 'sales'
where key = 'crm';

update public.module_catalog set name = 'Inventory',
  description = 'Products, warehouses, zones, stock, transfers, adjustments, stock takes',
  category = 'operations'
where key = 'inventory';

update public.module_catalog set name = 'HR & Payroll',
  description = 'Employees, attendance, leave, salary structures, payroll runs, payslips, disciplinary',
  category = 'people'
where key = 'hr';

update public.module_catalog set name = 'Finance',
  description = 'Chart of accounts, general ledger, cashbook, reconciliation, expenses, IBAN, tax compliance',
  category = 'finance'
where key = 'finance';

update public.module_catalog set name = 'Service Management',
  description = 'Tickets, service requests, SLAs, warranty, and integrated local payment, SMS, and tax services',
  category = 'operations'
where key = 'service_management';

update public.module_catalog set name = 'Logistics & Fleet',
  description = 'Shipments, deliveries, carriers, dispatch, vehicles, drivers, fuel, maintenance',
  category = 'operations'
where key = 'logistics';

update public.module_catalog set name = 'Risk & Compliance',
  description = 'Insurers, policies, claims, risk register, SHEQ incidents, inspections',
  category = 'operations'
where key = 'risk_insurance';

update public.module_catalog set name = 'Documents & Reporting',
  description = 'Documents, folders, versions, reports, dashboards, email log',
  category = 'platform'
where key = 'documents';

update public.module_catalog set
  description = 'Projects, tasks, milestones, timesheets, petty cash'
where key = 'projects';

-- 2. Migrate org_modules rows from absorbed keys onto their survivors.
create temporary table _module_map (old_key text primary key, new_key text not null) on commit drop;

insert into _module_map (old_key, new_key) values
  ('purchasing', 'sales'),
  ('tender_bidding', 'sales'),
  ('marketing', 'crm'),
  ('social_media', 'crm'),
  ('warehousing', 'inventory'),
  ('stock_take', 'inventory'),
  ('payroll', 'hr'),
  ('disciplinary', 'hr'),
  ('iban', 'finance'),
  ('tax_compliance', 'finance'),
  ('local_services', 'service_management'),
  ('fleet', 'logistics'),
  ('sheq', 'risk_insurance'),
  ('reporting', 'documents'),
  ('email', 'documents');

-- 2a. Where an org already has the survivor row AND an absorbed row, the
-- survivor wins — but upgrade it to enabled if the absorbed row was enabled
-- (e.g. org enabled payroll but not hr: after the merge, hr is enabled).
update public.org_modules om
set status = 'enabled',
    enabled_at = coalesce(om.enabled_at, now()),
    updated_at = now()
from _module_map m
where om.module_key = m.new_key
  and om.status <> 'enabled'
  and exists (
    select 1 from public.org_modules ab
    where ab.org_id = om.org_id and ab.module_key = m.old_key and ab.status = 'enabled'
  );

-- 2b. Drop absorbed rows where the org already has the survivor (the
-- survivor row now carries the merged state).
delete from public.org_modules om
using _module_map m
where om.module_key = m.old_key
  and exists (
    select 1 from public.org_modules sv
    where sv.org_id = om.org_id and sv.module_key = m.new_key
  );

-- 2c. Repoint the remaining absorbed rows (orgs that only ever had the
-- absorbed key) onto the survivor, preserving their status.
update public.org_modules om
set module_key = m.new_key,
    updated_at = now()
from _module_map m
where om.module_key = m.old_key;

-- 3. Remove absorbed entries from the catalog — no org_modules rows
-- reference them anymore, so the FK is satisfied.
delete from public.module_catalog
where key in (select old_key from _module_map);
