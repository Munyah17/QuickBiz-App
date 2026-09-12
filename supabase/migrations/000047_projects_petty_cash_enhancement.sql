-- Projects Enhancement: milestones, petty cash, timesheets, and resource
-- allocation on top of the existing Projects module.

insert into public.permissions (key, label, category) values
  ('projects.petty_cash', 'Manage project petty cash', 'operations'),
  ('projects.timesheets', 'Manage project timesheets', 'operations'),
  ('projects.milestones', 'Manage project milestones', 'operations'),
  ('projects.resources', 'Manage project resources', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('projects.petty_cash', 'projects.timesheets', 'projects.milestones', 'projects.resources')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('projects.timesheets', 'projects.milestones', 'projects.resources')
on conflict do nothing;

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  completed_at timestamptz,
  progress numeric(5, 2) default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_milestones_project_id_idx on public.project_milestones (project_id);
create index if not exists project_milestones_status_idx on public.project_milestones (status);

alter table public.project_milestones enable row level security;

create policy project_milestones_select on public.project_milestones
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy project_milestones_write on public.project_milestones
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.milestones'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.milestones'));

create trigger set_project_milestones_updated_at
  before update on public.project_milestones
  for each row execute function public.set_updated_at();

-- Petty cash balances are financial data - gate SELECT by the same
-- permission as write, not open org membership (matching Payroll's
-- treatment of financial/compensation data in 000039).
create table if not exists public.project_petty_cash (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  fund_name text not null,
  initial_amount numeric(18, 2) not null,
  current_balance numeric(18, 2) not null,
  currency text not null default 'USD',
  custodian_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_petty_cash_project_id_idx on public.project_petty_cash (project_id);
create index if not exists project_petty_cash_custodian_id_idx on public.project_petty_cash (custodian_id);

alter table public.project_petty_cash enable row level security;

create policy project_petty_cash_select on public.project_petty_cash
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.petty_cash'));

create policy project_petty_cash_write on public.project_petty_cash
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.petty_cash'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.petty_cash'));

create trigger set_project_petty_cash_updated_at
  before update on public.project_petty_cash
  for each row execute function public.set_updated_at();

create table if not exists public.petty_cash_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  petty_cash_id uuid not null references public.project_petty_cash(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('replenish', 'disbursement', 'reimbursement', 'adjustment')),
  amount numeric(18, 2) not null,
  description text not null,
  category text,
  receipt_number text,
  recipient_id uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists petty_cash_transactions_petty_cash_id_idx on public.petty_cash_transactions (petty_cash_id);
create index if not exists petty_cash_transactions_transaction_date_idx on public.petty_cash_transactions (transaction_date);

alter table public.petty_cash_transactions enable row level security;

create policy petty_cash_transactions_select on public.petty_cash_transactions
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.petty_cash'));

create policy petty_cash_transactions_insert on public.petty_cash_transactions
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.petty_cash'));

create table if not exists public.project_timesheets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete set null,
  staff_id uuid not null references public.profiles(id) on delete restrict,
  date date not null,
  hours numeric(5, 2) not null,
  description text,
  billable boolean not null default true,
  hourly_rate numeric(10, 2),
  approved boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_timesheets_project_id_idx on public.project_timesheets (project_id);
create index if not exists project_timesheets_staff_id_idx on public.project_timesheets (staff_id);
create index if not exists project_timesheets_date_idx on public.project_timesheets (date);

alter table public.project_timesheets enable row level security;

create policy project_timesheets_select on public.project_timesheets
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy project_timesheets_write on public.project_timesheets
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.timesheets'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.timesheets'));

create trigger set_project_timesheets_updated_at
  before update on public.project_timesheets
  for each row execute function public.set_updated_at();

create table if not exists public.project_resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  resource_type text not null check (resource_type in ('staff', 'equipment', 'material', 'facility')),
  resource_id uuid,
  resource_name text not null,
  allocated_quantity numeric(10, 2) default 1,
  unit text,
  cost_per_unit numeric(12, 2),
  total_cost numeric(12, 2),
  allocation_start date,
  allocation_end date,
  utilization_percent numeric(5, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_resources_project_id_idx on public.project_resources (project_id);
create index if not exists project_resources_resource_type_idx on public.project_resources (resource_type);

alter table public.project_resources enable row level security;

create policy project_resources_select on public.project_resources
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy project_resources_write on public.project_resources
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.resources'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.resources'));

create trigger set_project_resources_updated_at
  before update on public.project_resources
  for each row execute function public.set_updated_at();

-- RPC functions

create or replace function public.create_project_milestone(p_project_id uuid, p_name text, p_description text, p_due_date date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_milestone_id uuid;
begin
  select org_id into v_org_id from public.projects where id = p_project_id;

  if v_org_id is null then
    raise exception 'Project not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'projects.milestones') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.project_milestones (org_id, project_id, name, description, due_date)
  values (v_org_id, p_project_id, p_name, p_description, p_due_date)
  returning id into v_milestone_id;

  return v_milestone_id;
end;
$$;

create or replace function public.create_petty_cash_fund(p_project_id uuid, p_fund_name text, p_initial_amount numeric, p_custodian_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_fund_id uuid;
begin
  select org_id into v_org_id from public.projects where id = p_project_id;

  if v_org_id is null then
    raise exception 'Project not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'projects.petty_cash') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.project_petty_cash (org_id, project_id, fund_name, initial_amount, current_balance, custodian_id)
  values (v_org_id, p_project_id, p_fund_name, p_initial_amount, p_initial_amount, p_custodian_id)
  returning id into v_fund_id;

  return v_fund_id;
end;
$$;

create or replace function public.create_petty_cash_transaction(p_petty_cash_id uuid, p_transaction_type text, p_amount numeric, p_description text, p_category text default null, p_receipt_number text default null, p_recipient_id uuid default null, p_approved_by uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_current_balance numeric;
  v_transaction_id uuid;
begin
  select org_id, current_balance into v_org_id, v_current_balance from public.project_petty_cash where id = p_petty_cash_id;

  if v_org_id is null then
    raise exception 'Petty cash fund not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'projects.petty_cash') then
    raise exception 'insufficient permissions';
  end if;

  if p_transaction_type = 'disbursement' and p_amount > v_current_balance then
    raise exception 'Insufficient petty cash balance';
  end if;

  insert into public.petty_cash_transactions (org_id, petty_cash_id, transaction_type, amount, description, category, receipt_number, recipient_id, approved_by)
  values (v_org_id, p_petty_cash_id, p_transaction_type, p_amount, p_description, p_category, p_receipt_number, p_recipient_id, p_approved_by)
  returning id into v_transaction_id;

  if p_transaction_type in ('replenish', 'reimbursement') then
    update public.project_petty_cash set current_balance = current_balance + p_amount where id = p_petty_cash_id;
  elsif p_transaction_type = 'disbursement' then
    update public.project_petty_cash set current_balance = current_balance - p_amount where id = p_petty_cash_id;
  end if;

  return v_transaction_id;
end;
$$;

create or replace function public.submit_timesheet(p_project_id uuid, p_task_id uuid, p_staff_id uuid, p_date date, p_hours numeric, p_description text default null, p_billable boolean default true, p_hourly_rate numeric default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_timesheet_id uuid;
begin
  select org_id into v_org_id from public.projects where id = p_project_id;

  if v_org_id is null then
    raise exception 'Project not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'projects.timesheets') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.project_timesheets (org_id, project_id, task_id, staff_id, date, hours, description, billable, hourly_rate)
  values (v_org_id, p_project_id, p_task_id, p_staff_id, p_date, p_hours, p_description, p_billable, p_hourly_rate)
  returning id into v_timesheet_id;

  return v_timesheet_id;
end;
$$;

create or replace function public.allocate_project_resource(p_project_id uuid, p_resource_type text, p_resource_id uuid, p_resource_name text, p_allocated_quantity numeric, p_unit text default null, p_cost_per_unit numeric default null, p_allocation_start date default null, p_allocation_end date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_resource_id uuid;
  v_total_cost numeric;
begin
  select org_id into v_org_id from public.projects where id = p_project_id;

  if v_org_id is null then
    raise exception 'Project not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'projects.resources') then
    raise exception 'insufficient permissions';
  end if;

  v_total_cost := p_allocated_quantity * coalesce(p_cost_per_unit, 0);

  insert into public.project_resources (org_id, project_id, resource_type, resource_id, resource_name, allocated_quantity, unit, cost_per_unit, total_cost, allocation_start, allocation_end)
  values (v_org_id, p_project_id, p_resource_type, p_resource_id, p_resource_name, p_allocated_quantity, p_unit, p_cost_per_unit, v_total_cost, p_allocation_start, p_allocation_end)
  returning id into v_resource_id;

  return v_resource_id;
end;
$$;

create or replace function public.list_project_petty_cash(p_project_id uuid)
returns table (
  id uuid,
  fund_name text,
  initial_amount numeric,
  current_balance numeric,
  currency text,
  custodian_name text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.projects where id = p_project_id;

  if v_org_id is null then
    raise exception 'Project not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'projects.petty_cash') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    pc.id,
    pc.fund_name,
    pc.initial_amount,
    pc.current_balance,
    pc.currency,
    p.full_name as custodian_name,
    pc.status
  from public.project_petty_cash pc
  left join public.profiles p on pc.custodian_id = p.id
  where pc.project_id = p_project_id;
end;
$$;
