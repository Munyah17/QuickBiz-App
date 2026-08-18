-- HR module, scoped to what's genuinely useful without full payroll
-- complexity: an employee directory linked to the branches/departments
-- already built in the foundation. Attendance/leave/payroll/benefits (the
-- rest of spec's HR list) are real future work, not faked here.

insert into public.permissions (key, label, category) values
  ('hr.manage', 'Manage employee records', 'people')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'hr.manage'
on conflict do nothing;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  -- Nullable: an employee may or may not also be a system user (org_members
  -- row). Linking here (rather than requiring one) is what makes "General
  -- hands with no system access" (spec's own example) representable.
  profile_id uuid references public.profiles(id) on delete set null,
  employee_number text not null,
  full_name text not null,
  email text,
  phone text,
  position text,
  hire_date date,
  employment_status text not null default 'active' check (employment_status in ('active', 'on_leave', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, employee_number)
);

create index if not exists employees_org_id_idx on public.employees (org_id);

alter table public.employees enable row level security;

create trigger set_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

create policy employees_select on public.employees
  for select using (org_id in (select public.user_org_ids()));

create policy employees_write on public.employees
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'hr.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'hr.manage'));

create trigger audit_employees
  after insert or update or delete on public.employees
  for each row execute function public.audit_trigger_with_module('hr');
