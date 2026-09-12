-- SHEQ Module: Safety, Health, Environment, Quality management - incidents,
-- inspections, risk assessments, and training records.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('sheq', 'SHEQ Management', 'Comprehensive Safety, Health, Environment, and Quality management. Track incidents, conduct inspections, manage audits, assess risks, and ensure regulatory compliance.', 'operations', 25)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('sheq.manage', 'Manage SHEQ records and incidents', 'operations'),
  ('sheq.view', 'View SHEQ reports and records', 'operations'),
  ('sheq.audit', 'Conduct SHEQ audits and inspections', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('sheq.manage', 'sheq.view', 'sheq.audit')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('sheq.view', 'sheq.audit')
on conflict do nothing;

create table if not exists public.sheq_incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  incident_number text not null unique,
  incident_type text not null check (incident_type in ('injury', 'illness', 'near_miss', 'property_damage', 'environmental', 'security', 'fire', 'other')),
  severity text not null check (severity in ('minor', 'moderate', 'major', 'critical')),
  title text not null,
  description text not null,
  location text,
  date_occurred date not null,
  time_occurred time,
  reported_by uuid references public.profiles(id) on delete set null,
  involved_persons text,
  witnesses text,
  immediate_actions text,
  status text not null default 'open' check (status in ('open', 'under_investigation', 'closed', 'archived')),
  root_cause text,
  corrective_actions text,
  preventive_actions text,
  assigned_to uuid references public.profiles(id) on delete set null,
  target_completion_date date,
  actual_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sheq_incidents_org_id_idx on public.sheq_incidents (org_id);
create index if not exists sheq_incidents_branch_id_idx on public.sheq_incidents (branch_id);
create index if not exists sheq_incidents_status_idx on public.sheq_incidents (status);
create index if not exists sheq_incidents_date_occurred_idx on public.sheq_incidents (date_occurred);

alter table public.sheq_incidents enable row level security;

create policy sheq_incidents_select on public.sheq_incidents
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy sheq_incidents_write on public.sheq_incidents
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.manage'));

create trigger set_sheq_incidents_updated_at
  before update on public.sheq_incidents
  for each row execute function public.set_updated_at();

create table if not exists public.sheq_inspections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  inspection_number text not null unique,
  inspection_type text not null check (inspection_type in ('safety', 'health', 'environmental', 'quality', 'fire', 'equipment', 'housekeeping')),
  title text not null,
  description text,
  area text,
  scheduled_date date not null,
  completed_date date,
  inspector_id uuid references public.profiles(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  findings text,
  non_conformities int default 0,
  minor_issues int default 0,
  major_issues int default 0,
  critical_issues int default 0,
  overall_score numeric(5, 2),
  recommendations text,
  follow_up_required boolean not null default false,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sheq_inspections_org_id_idx on public.sheq_inspections (org_id);
create index if not exists sheq_inspections_branch_id_idx on public.sheq_inspections (branch_id);
create index if not exists sheq_inspections_status_idx on public.sheq_inspections (status);
create index if not exists sheq_inspections_scheduled_date_idx on public.sheq_inspections (scheduled_date);

alter table public.sheq_inspections enable row level security;

create policy sheq_inspections_select on public.sheq_inspections
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy sheq_inspections_write on public.sheq_inspections
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.audit'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.audit'));

create trigger set_sheq_inspections_updated_at
  before update on public.sheq_inspections
  for each row execute function public.set_updated_at();

create table if not exists public.sheq_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  assessment_number text not null unique,
  hazard text not null,
  category text check (category in ('physical', 'chemical', 'biological', 'ergonomic', 'psychosocial', 'safety', 'environmental')),
  location text,
  affected_personnel text,
  likelihood numeric(5, 2) check (likelihood between 1 and 5),
  severity numeric(5, 2) check (severity between 1 and 5),
  risk_score numeric(5, 2) generated always as (likelihood * severity) stored,
  risk_level text generated always as (
    case
      when (likelihood * severity) >= 15 then 'critical'
      when (likelihood * severity) >= 10 then 'high'
      when (likelihood * severity) >= 5 then 'medium'
      else 'low'
    end
  ) stored,
  existing_controls text,
  recommended_controls text,
  responsible_person uuid references public.profiles(id) on delete set null,
  target_date date,
  review_date date,
  status text not null default 'open' check (status in ('open', 'mitigated', 'accepted', 'closed')),
  assessed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sheq_risk_assessments_org_id_idx on public.sheq_risk_assessments (org_id);
create index if not exists sheq_risk_assessments_branch_id_idx on public.sheq_risk_assessments (branch_id);
create index if not exists sheq_risk_assessments_risk_level_idx on public.sheq_risk_assessments (risk_level);
create index if not exists sheq_risk_assessments_status_idx on public.sheq_risk_assessments (status);

alter table public.sheq_risk_assessments enable row level security;

create policy sheq_risk_assessments_select on public.sheq_risk_assessments
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy sheq_risk_assessments_write on public.sheq_risk_assessments
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.manage'));

create trigger set_sheq_risk_assessments_updated_at
  before update on public.sheq_risk_assessments
  for each row execute function public.set_updated_at();

create table if not exists public.sheq_training (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  training_type text not null check (training_type in ('safety', 'health', 'environmental', 'quality', 'fire', 'first_aid', 'equipment', 'other')),
  title text not null,
  description text,
  instructor text,
  training_date date not null,
  duration_hours numeric(5, 2),
  location text,
  attendees jsonb default '[]'::jsonb,
  certification_expiry date,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sheq_training_org_id_idx on public.sheq_training (org_id);
create index if not exists sheq_training_training_date_idx on public.sheq_training (training_date);
create index if not exists sheq_training_status_idx on public.sheq_training (status);

alter table public.sheq_training enable row level security;

create policy sheq_training_select on public.sheq_training
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy sheq_training_write on public.sheq_training
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sheq.manage'));

create trigger set_sheq_training_updated_at
  before update on public.sheq_training
  for each row execute function public.set_updated_at();

-- RPC functions

create or replace function public.create_sheq_incident(p_org_id uuid, p_incident_type text, p_severity text, p_title text, p_description text, p_date_occurred date, p_branch_id uuid default null, p_location text default null, p_reported_by uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident_id uuid;
  v_incident_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sheq.manage') then
    raise exception 'insufficient permissions';
  end if;

  v_incident_number := 'INC-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.sheq_incidents (org_id, branch_id, incident_number, incident_type, severity, title, description, location, date_occurred, reported_by)
  values (p_org_id, p_branch_id, v_incident_number, p_incident_type, p_severity, p_title, p_description, p_location, p_date_occurred, p_reported_by)
  returning id into v_incident_id;

  return v_incident_id;
end;
$$;

create or replace function public.create_sheq_inspection(p_org_id uuid, p_inspection_type text, p_title text, p_scheduled_date date, p_branch_id uuid default null, p_inspector_id uuid default null, p_description text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inspection_id uuid;
  v_inspection_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sheq.audit') then
    raise exception 'insufficient permissions';
  end if;

  v_inspection_number := 'INS-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.sheq_inspections (org_id, branch_id, inspection_number, inspection_type, title, description, scheduled_date, inspector_id)
  values (p_org_id, p_branch_id, v_inspection_number, p_inspection_type, p_title, p_description, p_scheduled_date, p_inspector_id)
  returning id into v_inspection_id;

  return v_inspection_id;
end;
$$;

create or replace function public.create_sheq_risk_assessment(p_org_id uuid, p_hazard text, p_category text, p_likelihood numeric, p_severity numeric, p_branch_id uuid default null, p_location text default null, p_responsible_person uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment_id uuid;
  v_assessment_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sheq.manage') then
    raise exception 'insufficient permissions';
  end if;

  v_assessment_number := 'RISK-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.sheq_risk_assessments (org_id, branch_id, assessment_number, hazard, category, location, likelihood, severity, responsible_person, assessed_by)
  values (p_org_id, p_branch_id, v_assessment_number, p_hazard, p_category, p_location, p_likelihood, p_severity, p_responsible_person, auth.uid())
  returning id into v_assessment_id;

  return v_assessment_id;
end;
$$;

create or replace function public.list_sheq_incidents(p_org_id uuid, p_status text default null, p_limit int default 50)
returns table (
  id uuid,
  incident_number text,
  incident_type text,
  severity text,
  title text,
  date_occurred date,
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
  if not public.has_permission(p_org_id, 'sheq.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select id, incident_number, incident_type, severity, title, date_occurred, status
  from public.sheq_incidents
  where org_id = p_org_id
    and (p_status is null or status = p_status)
  order by date_occurred desc
  limit p_limit;
end;
$$;
