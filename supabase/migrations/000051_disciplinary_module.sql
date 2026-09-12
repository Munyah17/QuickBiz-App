-- Disciplinary Management Module: cases, hearings, and warnings.
--
-- Disciplinary records (violations, warnings, terminations) are as
-- sensitive as compensation data - unlike most modules here, SELECT is
-- gated by disciplinary.view rather than open org membership, matching how
-- Payroll (000039) treats salary data.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('disciplinary', 'Disciplinary Management', 'Manage employee disciplinary cases, warnings, hearings, and conduct records. Track violations, document actions, and maintain complete disciplinary history.', 'hr', 15)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('disciplinary.manage', 'Manage disciplinary cases and actions', 'hr'),
  ('disciplinary.view', 'View disciplinary records', 'hr')
on conflict (key) do nothing;

-- Director/manager only, not team_leader - matches Payroll's sensitivity
-- treatment for HR-sensitive data.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('disciplinary.manage', 'disciplinary.view')
on conflict do nothing;

create table if not exists public.disciplinary_cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  case_number text not null unique,
  violation_type text not null check (violation_type in ('absenteeism', 'misconduct', 'insubordination', 'negligence', 'harassment', 'theft', 'policy_violation', 'performance', 'safety', 'other')),
  severity text not null check (severity in ('minor', 'moderate', 'major', 'gross')),
  title text not null,
  description text not null,
  incident_date date not null,
  reported_by uuid references public.profiles(id) on delete set null,
  witness_names text,
  evidence text,
  status text not null default 'open' check (status in ('open', 'under_investigation', 'hearing_scheduled', 'hearing_completed', 'action_taken', 'appealed', 'closed')),
  action_taken text,
  action_type text check (action_type in ('verbal_warning', 'written_warning', 'suspension', 'demotion', 'termination', 'training', 'counseling', 'no_action')),
  action_effective_date date,
  action_end_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disciplinary_cases_org_id_idx on public.disciplinary_cases (org_id);
create index if not exists disciplinary_cases_employee_id_idx on public.disciplinary_cases (employee_id);
create index if not exists disciplinary_cases_status_idx on public.disciplinary_cases (status);
create index if not exists disciplinary_cases_incident_date_idx on public.disciplinary_cases (incident_date);

alter table public.disciplinary_cases enable row level security;

create policy disciplinary_cases_select on public.disciplinary_cases
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.view'));

create policy disciplinary_cases_write on public.disciplinary_cases
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.manage'));

create trigger set_disciplinary_cases_updated_at
  before update on public.disciplinary_cases
  for each row execute function public.set_updated_at();

create table if not exists public.disciplinary_hearings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.disciplinary_cases(id) on delete cascade,
  hearing_date date not null,
  hearing_time time,
  location text,
  chairperson_id uuid references public.profiles(id) on delete set null,
  panel_members jsonb default '[]'::jsonb,
  employee_present boolean not null default true,
  representative_present boolean,
  notes text,
  outcome text,
  decision text,
  decision_date date,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disciplinary_hearings_case_id_idx on public.disciplinary_hearings (case_id);
create index if not exists disciplinary_hearings_status_idx on public.disciplinary_hearings (status);

alter table public.disciplinary_hearings enable row level security;

create policy disciplinary_hearings_select on public.disciplinary_hearings
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.view'));

create policy disciplinary_hearings_write on public.disciplinary_hearings
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.manage'));

create trigger set_disciplinary_hearings_updated_at
  before update on public.disciplinary_hearings
  for each row execute function public.set_updated_at();

create table if not exists public.disciplinary_warnings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  case_id uuid references public.disciplinary_cases(id) on delete set null,
  warning_type text not null check (warning_type in ('verbal', 'written', 'final')),
  reason text not null,
  issued_date date not null,
  issued_by uuid references public.profiles(id) on delete set null,
  expires_date date,
  acknowledged boolean not null default false,
  acknowledged_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists disciplinary_warnings_org_id_idx on public.disciplinary_warnings (org_id);
create index if not exists disciplinary_warnings_employee_id_idx on public.disciplinary_warnings (employee_id);
create index if not exists disciplinary_warnings_case_id_idx on public.disciplinary_warnings (case_id);

alter table public.disciplinary_warnings enable row level security;

create policy disciplinary_warnings_select on public.disciplinary_warnings
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.view'));

create policy disciplinary_warnings_insert on public.disciplinary_warnings
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'disciplinary.manage'));

-- RPC functions

create or replace function public.create_disciplinary_case(p_org_id uuid, p_employee_id uuid, p_violation_type text, p_severity text, p_title text, p_description text, p_incident_date date, p_reported_by uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
  v_case_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'disciplinary.manage') then
    raise exception 'insufficient permissions';
  end if;

  v_case_number := 'DISC-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.disciplinary_cases (org_id, employee_id, case_number, violation_type, severity, title, description, incident_date, reported_by, created_by)
  values (p_org_id, p_employee_id, v_case_number, p_violation_type, p_severity, p_title, p_description, p_incident_date, p_reported_by, auth.uid())
  returning id into v_case_id;

  return v_case_id;
end;
$$;

create or replace function public.create_disciplinary_warning(p_org_id uuid, p_employee_id uuid, p_warning_type text, p_reason text, p_case_id uuid default null, p_expires_date date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_warning_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'disciplinary.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.disciplinary_warnings (org_id, employee_id, case_id, warning_type, reason, issued_date, issued_by, expires_date)
  values (p_org_id, p_employee_id, p_case_id, p_warning_type, p_reason, current_date, auth.uid(), p_expires_date)
  returning id into v_warning_id;

  return v_warning_id;
end;
$$;

create or replace function public.schedule_disciplinary_hearing(p_case_id uuid, p_hearing_date date, p_hearing_time time default null, p_location text default null, p_chairperson_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_hearing_id uuid;
begin
  select org_id into v_org_id from public.disciplinary_cases where id = p_case_id;

  if v_org_id is null then
    raise exception 'Case not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'disciplinary.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.disciplinary_hearings (org_id, case_id, hearing_date, hearing_time, location, chairperson_id)
  values (v_org_id, p_case_id, p_hearing_date, p_hearing_time, p_location, p_chairperson_id)
  returning id into v_hearing_id;

  return v_hearing_id;
end;
$$;

create or replace function public.list_disciplinary_cases(p_org_id uuid, p_status text default null, p_employee_id uuid default null, p_limit int default 50)
returns table (
  id uuid,
  case_number text,
  employee_name text,
  violation_type text,
  severity text,
  title text,
  incident_date date,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'disciplinary.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    dc.id,
    dc.case_number,
    e.full_name as employee_name,
    dc.violation_type,
    dc.severity,
    dc.title,
    dc.incident_date,
    dc.status
  from public.disciplinary_cases dc
  left join public.employees e on dc.employee_id = e.id
  where dc.org_id = p_org_id
    and (p_status is null or dc.status = p_status)
    and (p_employee_id is null or dc.employee_id = p_employee_id)
  order by dc.incident_date desc
  limit p_limit;
end;
$$;
