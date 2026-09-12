-- Tax Compliance Module: ZIMRA-aligned tax period/filing/payment tracker
-- plus fiscal device (FDMS) registration. This is a COMPLIANCE TRACKER, not
-- an auto-filing system - nothing here calls any real ZIMRA API or claims a
-- filing was actually accepted by ZIMRA. "Submit" means "we recorded that
-- this business submitted it" (through ZIMRA's own e-Services/FDMS
-- directly), matching how Campaigns tracks outreach sent through the
-- business's own channels rather than pretending to send anything itself.
-- zimra_response/zimra_signature/zimra_device_id columns exist for a real
-- future FDMS integration to populate - nothing writes fabricated values
-- into them here.
--
-- Seeded due-day figures (PAYE 10th, VAT 25th, WHT 10th) are checked
-- against real ZIMRA public notices as of 2026-09, not guessed - but VAT
-- due dates vary by taxpayer category (A/B/C) which this single due_day
-- model doesn't yet capture, and ZIMRA updates deadlines by public notice.
-- Treat these as a verified starting point, not a permanently-correct
-- source of truth - a business should still confirm against current ZIMRA
-- notices, same caution as Payroll's tax settings in 000039.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('tax_compliance', 'Tax Compliance & ZIMRA', 'Track tax periods, filings, payments, and fiscal device registrations aligned to ZIMRA''s tax calendar. Records what you have filed and paid through ZIMRA''s own e-Services/FDMS - does not file on your behalf.', 'finance', 35)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('tax_compliance.manage', 'Manage tax periods, filings, and fiscal devices', 'finance'),
  ('tax_compliance.file', 'Record tax return submissions and payments', 'finance'),
  ('tax_compliance.view', 'View tax records and reports', 'finance')
on conflict (key) do nothing;

-- Tax/financial-compliance data - restricted to director/manager, matching
-- Payroll's treatment of similarly sensitive financial data in 000039.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('tax_compliance.manage', 'tax_compliance.file', 'tax_compliance.view')
on conflict do nothing;

-- Tax types - global reference data.
create table if not exists public.tax_types (
  key text primary key,
  name text not null,
  description text,
  frequency text not null check (frequency in ('monthly', 'quarterly', 'annual', 'ad_hoc')),
  zimra_code text,
  due_day int
);

insert into public.tax_types (key, name, description, frequency, zimra_code, due_day) values
  ('paye', 'PAYE (Pay As You Earn)', 'Income tax withheld from employee salaries', 'monthly', 'PAYE', 10),
  ('vat', 'VAT (Value Added Tax)', 'Value Added Tax on sales and purchases - due date varies by taxpayer category (A/B/C); 25th shown here as the common case', 'monthly', 'VAT', 25),
  ('withholding_tax', 'Withholding Tax', 'Tax withheld on certain payments to contractors', 'monthly', 'WHT', 10),
  ('corporate_tax', 'Corporate Income Tax', 'Quarterly payment dates (QPDs) on company profits', 'quarterly', 'CIT', 30),
  ('presumptive_tax', 'Presumptive Tax', 'Tax for small businesses and informal sector', 'quarterly', 'PT', 30),
  ('capital_gains', 'Capital Gains Tax', 'Tax on sale of assets', 'ad_hoc', 'CGT', null)
on conflict (key) do nothing;

alter table public.tax_types enable row level security;

create policy tax_types_select on public.tax_types
  for select to authenticated using (true);

create table if not exists public.tax_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tax_type_key text not null references public.tax_types(key) on delete restrict,
  year int not null,
  period int not null,
  start_date date not null,
  end_date date not null,
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'filed', 'paid', 'overdue', 'adjusted')),
  created_at timestamptz not null default now(),
  unique (org_id, tax_type_key, year, period)
);

create index if not exists tax_periods_org_id_idx on public.tax_periods (org_id);
create index if not exists tax_periods_tax_type_key_idx on public.tax_periods (tax_type_key);
create index if not exists tax_periods_status_idx on public.tax_periods (status);

alter table public.tax_periods enable row level security;

create policy tax_periods_select on public.tax_periods
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy tax_periods_write on public.tax_periods
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.manage'));

create table if not exists public.tax_filings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tax_period_id uuid not null references public.tax_periods(id) on delete cascade,
  filing_reference text,
  amount numeric(18, 2) not null,
  currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'accepted', 'rejected', 'paid')),
  submitted_at timestamptz,
  accepted_at timestamptz,
  paid_at timestamptz,
  zimra_response jsonb,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tax_filings_org_id_idx on public.tax_filings (org_id);
create index if not exists tax_filings_tax_period_id_idx on public.tax_filings (tax_period_id);
create index if not exists tax_filings_status_idx on public.tax_filings (status);

alter table public.tax_filings enable row level security;

create policy tax_filings_select on public.tax_filings
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy tax_filings_write on public.tax_filings
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.manage'));

create trigger set_tax_filings_updated_at
  before update on public.tax_filings
  for each row execute function public.set_updated_at();

create table if not exists public.fiscal_devices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  device_serial text not null unique,
  device_type text not null,
  device_model text,
  manufacturer text,
  branch_id uuid references public.branches(id) on delete set null,
  zimra_device_id text,
  status text not null default 'active' check (status in ('active', 'inactive', 'decommissioned', 'malfunctioning')),
  last_sync timestamptz,
  installed_at timestamptz,
  decommissioned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fiscal_devices_org_id_idx on public.fiscal_devices (org_id);
create index if not exists fiscal_devices_branch_id_idx on public.fiscal_devices (branch_id);

alter table public.fiscal_devices enable row level security;

create policy fiscal_devices_select on public.fiscal_devices
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy fiscal_devices_write on public.fiscal_devices
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.manage'));

create trigger set_fiscal_devices_updated_at
  before update on public.fiscal_devices
  for each row execute function public.set_updated_at();

-- Fiscal transactions synced from FDMS - no insert policy: nothing writes
-- here until a real FDMS integration exists (same reasoning as
-- iban_transactions in 000042).
create table if not exists public.fiscal_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  fiscal_device_id uuid not null references public.fiscal_devices(id) on delete restrict,
  fiscal_serial text not null,
  invoice_number text not null,
  transaction_date timestamptz not null,
  amount numeric(18, 2) not null,
  vat_amount numeric(18, 2),
  zimra_signature text,
  qr_code text,
  synced_at timestamptz not null default now()
);

create index if not exists fiscal_transactions_org_id_idx on public.fiscal_transactions (org_id);
create index if not exists fiscal_transactions_fiscal_device_id_idx on public.fiscal_transactions (fiscal_device_id);
create index if not exists fiscal_transactions_transaction_date_idx on public.fiscal_transactions (transaction_date);

alter table public.fiscal_transactions enable row level security;

create policy fiscal_transactions_select on public.fiscal_transactions
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create table if not exists public.tax_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tax_filing_id uuid references public.tax_filings(id) on delete set null,
  amount numeric(18, 2) not null,
  currency text not null default 'USD',
  payment_method text not null,
  payment_reference text,
  bank_reference text,
  paid_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists tax_payments_org_id_idx on public.tax_payments (org_id);
create index if not exists tax_payments_tax_filing_id_idx on public.tax_payments (tax_filing_id);

alter table public.tax_payments enable row level security;

create policy tax_payments_select on public.tax_payments
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy tax_payments_write on public.tax_payments
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.file'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tax_compliance.file'));

-- RPC functions

create or replace function public.create_tax_period(p_org_id uuid, p_tax_type_key text, p_year int, p_period int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_id uuid;
  v_tax_type record;
  v_start_date date;
  v_end_date date;
  v_due_date date;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'tax_compliance.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_tax_type from public.tax_types where key = p_tax_type_key;

  if v_tax_type.frequency = 'monthly' then
    v_start_date := make_date(p_year, p_period, 1);
    v_end_date := (make_date(p_year, p_period, 1) + interval '1 month' - interval '1 day')::date;
    v_due_date := (make_date(p_year, p_period, v_tax_type.due_day))::date;
  elsif v_tax_type.frequency = 'quarterly' then
    v_start_date := make_date(p_year, ((p_period - 1) * 3) + 1, 1);
    v_end_date := (make_date(p_year, ((p_period - 1) * 3) + 3, 1) + interval '1 month' - interval '1 day')::date;
    v_due_date := (make_date(p_year, ((p_period - 1) * 3) + 3, v_tax_type.due_day))::date;
  end if;

  insert into public.tax_periods (org_id, tax_type_key, year, period, start_date, end_date, due_date)
  values (p_org_id, p_tax_type_key, p_year, p_period, v_start_date, v_end_date, v_due_date)
  returning id into v_period_id;

  return v_period_id;
end;
$$;

create or replace function public.create_tax_filing(p_tax_period_id uuid, p_amount numeric, p_currency text default 'USD')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_filing_id uuid;
begin
  select org_id into v_org_id from public.tax_periods where id = p_tax_period_id;

  if v_org_id is null then
    raise exception 'Tax period not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'tax_compliance.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.tax_filings (org_id, tax_period_id, amount, currency)
  values (v_org_id, p_tax_period_id, p_amount, p_currency)
  returning id into v_filing_id;

  return v_filing_id;
end;
$$;

create or replace function public.submit_tax_filing(p_tax_filing_id uuid, p_amount numeric, p_filing_reference text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.tax_filings where id = p_tax_filing_id;

  if v_org_id is null then
    raise exception 'Tax filing not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'tax_compliance.file') then
    raise exception 'insufficient permissions';
  end if;

  update public.tax_filings
  set
    amount = p_amount,
    filing_reference = coalesce(p_filing_reference, filing_reference),
    status = 'submitted',
    submitted_at = now(),
    submitted_by = auth.uid()
  where id = p_tax_filing_id;

  update public.tax_periods set status = 'filed'
  where id = (select tax_period_id from public.tax_filings where id = p_tax_filing_id);
end;
$$;

create or replace function public.register_fiscal_device(p_org_id uuid, p_device_serial text, p_device_type text, p_device_model text, p_manufacturer text, p_branch_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'tax_compliance.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.fiscal_devices (org_id, device_serial, device_type, device_model, manufacturer, branch_id, installed_at)
  values (p_org_id, p_device_serial, p_device_type, p_device_model, p_manufacturer, p_branch_id, now())
  returning id into v_device_id;

  return v_device_id;
end;
$$;

create or replace function public.list_tax_filings(p_org_id uuid, p_status text default null, p_limit int default 50)
returns table (
  id uuid,
  tax_type_key text,
  year int,
  period int,
  amount numeric,
  status text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'tax_compliance.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    tf.id,
    tp.tax_type_key,
    tp.year,
    tp.period,
    tf.amount,
    tf.status,
    tf.submitted_at
  from public.tax_filings tf
  join public.tax_periods tp on tf.tax_period_id = tp.id
  where tf.org_id = p_org_id
    and (p_status is null or tf.status = p_status)
  order by tf.created_at desc
  limit p_limit;
end;
$$;
