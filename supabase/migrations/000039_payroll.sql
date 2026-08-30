-- Payroll module. Builds on the existing Employee entity (HR module)
-- rather than duplicating it — HR keeps owning employee records, Payroll
-- adds compensation structure and pay runs on top of them.
--
-- PAYE bands, NSSA rates, and the AIDS levy rate are ORG-EDITABLE settings,
-- not hardcoded. Zimbabwean statutory rates change over time and this build
-- cannot guarantee it knows the rate in force at the moment any given
-- business runs payroll, so every rate defaults to 0 / empty and the
-- settings page tells the user explicitly to enter current figures from
-- ZIMRA/their tax advisor before relying on this. Same caution the user
-- asked for on the licensing/phone-home design applies here to statutory
-- tax figures: build the (standard, well-known) calculation method, never
-- invent the numbers that go into it.
--
-- Salary and payslip data is materially more sensitive than most
-- operational records in this app, so unlike most modules here every
-- payroll table's SELECT policy is gated by payroll.manage (not just org
-- membership), and none of them get the generic audit_trigger_with_module —
-- that trigger logs full to_jsonb(OLD/NEW) row diffs into audit_logs,
-- readable by anyone with the broader audit.view permission, which would
-- leak individual salary figures past the payroll.manage boundary (same
-- reasoning as org_integration_connections in 000035). payroll.manage
-- itself is only granted to director/manager by default, not team_leader,
-- for the same reason.

insert into public.permissions (key, label, category) values
  ('payroll.manage', 'Manage payroll runs and salary structures', 'people')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key = 'payroll.manage'
on conflict do nothing;

-- Basic salary deliberately does NOT live on public.employees: that table's
-- SELECT policy allows any active org member to read it (see 000024_hr.sql),
-- so a compensation figure stored there would be readable by everyone in
-- the org regardless of payroll.manage — RLS is row-level, not
-- column-level, so a narrower app-side SELECT list would not actually
-- protect it from a direct query. One row per employee here instead, under
-- the same payroll.manage-gated policy as the rest of this module.
create table if not exists public.employee_compensation (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  basic_salary numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists employee_compensation_org_id_idx on public.employee_compensation (org_id);
alter table public.employee_compensation enable row level security;

create trigger set_employee_compensation_updated_at
  before update on public.employee_compensation
  for each row execute function public.set_updated_at();

create policy employee_compensation_select on public.employee_compensation
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create policy employee_compensation_write on public.employee_compensation
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create table if not exists public.salary_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  component_type text not null check (component_type in ('earning', 'deduction')),
  calculation_method text not null default 'fixed' check (calculation_method in ('fixed', 'percent_of_basic')),
  default_amount numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists salary_components_org_id_idx on public.salary_components (org_id);
alter table public.salary_components enable row level security;

create trigger set_salary_components_updated_at
  before update on public.salary_components
  for each row execute function public.set_updated_at();

create policy salary_components_select on public.salary_components
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create policy salary_components_write on public.salary_components
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

-- Recurring assignment of a component to an employee (e.g. "Housing
-- Allowance: $150/mo" or "Staff Loan Deduction: $50/mo"). `amount`
-- overrides the component's default_amount per employee; for a
-- percent_of_basic component, `amount` holds the percentage (5 = 5%).
create table if not exists public.employee_salary_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  component_id uuid not null references public.salary_components(id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, component_id)
);

create index if not exists employee_salary_components_org_id_idx on public.employee_salary_components (org_id);
create index if not exists employee_salary_components_employee_id_idx on public.employee_salary_components (employee_id);
alter table public.employee_salary_components enable row level security;

create trigger set_employee_salary_components_updated_at
  before update on public.employee_salary_components
  for each row execute function public.set_updated_at();

create policy employee_salary_components_select on public.employee_salary_components
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create policy employee_salary_components_write on public.employee_salary_components
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

-- One row per org (org_id is the primary key — same "singleton config row"
-- idea as billing_settings, just scoped per tenant here). paye_bands is a
-- progressive "quick deduction" table, the standard way tax authorities
-- (including ZIMRA) publish PAYE bands: for the bracket a gross pay falls
-- into, tax = gross * rate - deduct. Every rate/band starts empty/zero —
-- see the module-level comment above for why.
create table if not exists public.payroll_tax_settings (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  paye_bands jsonb not null default '[]'::jsonb,
  nssa_employee_rate numeric(5, 2) not null default 0,
  nssa_employer_rate numeric(5, 2) not null default 0,
  nssa_insurable_ceiling numeric(12, 2),
  aids_levy_rate numeric(5, 2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.payroll_tax_settings enable row level security;

create trigger set_payroll_tax_settings_updated_at
  before update on public.payroll_tax_settings
  for each row execute function public.set_updated_at();

create policy payroll_tax_settings_select on public.payroll_tax_settings
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create policy payroll_tax_settings_write on public.payroll_tax_settings
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  run_number text not null,
  period_start date not null,
  period_end date not null,
  pay_date date,
  status text not null default 'draft' check (status in ('draft', 'finalized', 'paid')),
  total_gross numeric(12, 2) not null default 0,
  total_deductions numeric(12, 2) not null default 0,
  total_net numeric(12, 2) not null default 0,
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, run_number)
);

create index if not exists payroll_runs_org_id_idx on public.payroll_runs (org_id);
alter table public.payroll_runs enable row level security;

create trigger set_payroll_runs_updated_at
  before update on public.payroll_runs
  for each row execute function public.set_updated_at();

create policy payroll_runs_select on public.payroll_runs
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create policy payroll_runs_write on public.payroll_runs
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  basic_salary numeric(12, 2) not null default 0,
  gross_pay numeric(12, 2) not null default 0,
  paye_amount numeric(12, 2) not null default 0,
  nssa_employee_amount numeric(12, 2) not null default 0,
  aids_levy_amount numeric(12, 2) not null default 0,
  other_deductions numeric(12, 2) not null default 0,
  net_pay numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

create index if not exists payslips_org_id_idx on public.payslips (org_id);
create index if not exists payslips_payroll_run_id_idx on public.payslips (payroll_run_id);
alter table public.payslips enable row level security;

create policy payslips_select on public.payslips
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

create policy payslips_write on public.payslips
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'payroll.manage'));

-- Itemized earnings/deductions per payslip (Basic Salary, Housing
-- Allowance, PAYE, NSSA, AIDS Levy, ...) so a printed payslip shows a real
-- breakdown, not just a net figure. No org_id of its own — scoped through
-- payslip_id, matching how invoice line items are scoped through their
-- invoice elsewhere in this schema.
create table if not exists public.payslip_lines (
  id uuid primary key default gen_random_uuid(),
  payslip_id uuid not null references public.payslips(id) on delete cascade,
  component_name text not null,
  component_type text not null check (component_type in ('earning', 'deduction')),
  amount numeric(12, 2) not null default 0
);

create index if not exists payslip_lines_payslip_id_idx on public.payslip_lines (payslip_id);
alter table public.payslip_lines enable row level security;

create policy payslip_lines_select on public.payslip_lines
  for select using (
    exists (
      select 1 from public.payslips p
      where p.id = payslip_lines.payslip_id
        and p.org_id in (select public.user_org_ids())
        and public.has_permission(p.org_id, 'payroll.manage')
    )
  );

create policy payslip_lines_write on public.payslip_lines
  for all using (
    exists (
      select 1 from public.payslips p
      where p.id = payslip_lines.payslip_id
        and p.org_id in (select public.user_org_ids())
        and public.has_permission(p.org_id, 'payroll.manage')
    )
  )
  with check (
    exists (
      select 1 from public.payslips p
      where p.id = payslip_lines.payslip_id
        and p.org_id in (select public.user_org_ids())
        and public.has_permission(p.org_id, 'payroll.manage')
    )
  );

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('payroll', 'Payroll', 'Salary structures, payroll runs, and payslips with configurable PAYE/NSSA/AIDS levy', 'people', 20)
on conflict (key) do nothing;
