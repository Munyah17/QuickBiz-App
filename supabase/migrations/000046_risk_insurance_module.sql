-- Risk & Insurance Module: onboard insurers, track policies, process
-- claims, and run risk assessments.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('risk_insurance', 'Risk & Insurance', 'Comprehensive risk management and insurance tracking. Onboard insurers, manage policies, process claims, conduct risk assessments, and ensure full coverage across assets, operations, and staff.', 'operations', 20)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('risk_insurance.manage', 'Manage risks and insurance policies', 'operations'),
  ('risk_insurance.claims', 'Process and manage insurance claims', 'operations'),
  ('risk_insurance.view', 'View risks, policies, and claims', 'operations'),
  ('risk_insurance.assess', 'Conduct risk assessments', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('risk_insurance.manage', 'risk_insurance.claims', 'risk_insurance.view', 'risk_insurance.assess')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('risk_insurance.view', 'risk_insurance.assess')
on conflict do nothing;

create table if not exists public.insurers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  policy_types jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create index if not exists insurers_org_id_idx on public.insurers (org_id);

alter table public.insurers enable row level security;

create policy insurers_select on public.insurers
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy insurers_write on public.insurers
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'risk_insurance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'risk_insurance.manage'));

create trigger set_insurers_updated_at
  before update on public.insurers
  for each row execute function public.set_updated_at();

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  insurer_id uuid references public.insurers(id) on delete set null,
  policy_number text not null,
  policy_type text not null check (policy_type in ('property', 'liability', 'workers_comp', 'vehicle', 'health', 'life', 'business_interruption', 'cyber', 'other')),
  coverage_type text,
  asset_id uuid references public.assets(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  sum_insured numeric(18, 2),
  premium numeric(18, 2) not null,
  currency text not null default 'USD',
  frequency text not null check (frequency in ('monthly', 'quarterly', 'annual')),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'pending_renewal')),
  renewal_reminder_days int default 30,
  policy_document text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, policy_number)
);

create index if not exists insurance_policies_org_id_idx on public.insurance_policies (org_id);
create index if not exists insurance_policies_insurer_id_idx on public.insurance_policies (insurer_id);
create index if not exists insurance_policies_status_idx on public.insurance_policies (status);
create index if not exists insurance_policies_end_date_idx on public.insurance_policies (end_date);

alter table public.insurance_policies enable row level security;

create policy insurance_policies_select on public.insurance_policies
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy insurance_policies_write on public.insurance_policies
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'risk_insurance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'risk_insurance.manage'));

create trigger set_insurance_policies_updated_at
  before update on public.insurance_policies
  for each row execute function public.set_updated_at();

create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  policy_id uuid not null references public.insurance_policies(id) on delete restrict,
  claim_number text not null unique,
  incident_date date not null,
  incident_description text not null,
  claim_amount numeric(18, 2) not null,
  currency text not null default 'USD',
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed')),
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  settlement_amount numeric(18, 2),
  insurer_reference text,
  supporting_documents jsonb default '[]'::jsonb,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists insurance_claims_org_id_idx on public.insurance_claims (org_id);
create index if not exists insurance_claims_policy_id_idx on public.insurance_claims (policy_id);
create index if not exists insurance_claims_status_idx on public.insurance_claims (status);

alter table public.insurance_claims enable row level security;

create policy insurance_claims_select on public.insurance_claims
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy insurance_claims_insert on public.insurance_claims
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'risk_insurance.claims'));

create policy insurance_claims_update on public.insurance_claims
  for update to authenticated
  using (
    org_id in (select public.user_org_ids())
    and (public.has_permission(org_id, 'risk_insurance.manage') or public.has_permission(org_id, 'risk_insurance.claims'))
  );

create trigger set_insurance_claims_updated_at
  before update on public.insurance_claims
  for each row execute function public.set_updated_at();

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text check (category in ('operational', 'financial', 'compliance', 'strategic', 'reputational', 'health_safety', 'other')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  likelihood numeric(3, 2) check (likelihood between 1 and 5),
  impact numeric(3, 2) check (impact between 1 and 5),
  risk_score numeric(5, 2),
  description text,
  mitigation_strategy text,
  owner_id uuid references public.profiles(id) on delete set null,
  review_date date,
  status text not null default 'open' check (status in ('open', 'mitigating', 'mitigated', 'accepted', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists risk_assessments_org_id_idx on public.risk_assessments (org_id);
create index if not exists risk_assessments_risk_level_idx on public.risk_assessments (risk_level);
create index if not exists risk_assessments_status_idx on public.risk_assessments (status);

alter table public.risk_assessments enable row level security;

create policy risk_assessments_select on public.risk_assessments
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy risk_assessments_insert on public.risk_assessments
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'risk_insurance.assess'));

create policy risk_assessments_update on public.risk_assessments
  for update to authenticated
  using (
    org_id in (select public.user_org_ids())
    and (public.has_permission(org_id, 'risk_insurance.manage') or public.has_permission(org_id, 'risk_insurance.assess'))
  );

create trigger set_risk_assessments_updated_at
  before update on public.risk_assessments
  for each row execute function public.set_updated_at();

-- RPC functions

create or replace function public.add_insurer(p_org_id uuid, p_name text, p_code text, p_contact_person text default null, p_email text default null, p_phone text default null, p_address text default null, p_policy_types jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_insurer_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'risk_insurance.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.insurers (org_id, name, code, contact_person, email, phone, address, policy_types, created_by)
  values (p_org_id, p_name, p_code, p_contact_person, p_email, p_phone, p_address, p_policy_types, auth.uid())
  returning id into v_insurer_id;

  return v_insurer_id;
end;
$$;

create or replace function public.create_insurance_policy(p_org_id uuid, p_insurer_id uuid, p_policy_number text, p_policy_type text, p_sum_insured numeric, p_premium numeric, p_start_date date, p_end_date date, p_asset_id uuid default null, p_vehicle_id uuid default null, p_coverage_type text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'risk_insurance.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.insurance_policies (org_id, insurer_id, policy_number, policy_type, coverage_type, asset_id, vehicle_id, sum_insured, premium, start_date, end_date, created_by)
  values (p_org_id, p_insurer_id, p_policy_number, p_policy_type, p_coverage_type, p_asset_id, p_vehicle_id, p_sum_insured, p_premium, p_start_date, p_end_date, auth.uid())
  returning id into v_policy_id;

  return v_policy_id;
end;
$$;

create or replace function public.submit_insurance_claim(p_policy_id uuid, p_incident_date date, p_incident_description text, p_claim_amount numeric, p_supporting_documents jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_claim_id uuid;
  v_claim_number text;
begin
  select org_id into v_org_id from public.insurance_policies where id = p_policy_id;

  if v_org_id is null then
    raise exception 'Policy not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'risk_insurance.claims') then
    raise exception 'insufficient permissions';
  end if;

  v_claim_number := 'CLM-' || to_char(current_date, 'YYYY') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.insurance_claims (org_id, policy_id, claim_number, incident_date, incident_description, claim_amount, supporting_documents, created_by)
  values (v_org_id, p_policy_id, v_claim_number, p_incident_date, p_incident_description, p_claim_amount, p_supporting_documents, auth.uid())
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

create or replace function public.create_risk_assessment(p_org_id uuid, p_title text, p_category text, p_likelihood numeric, p_impact numeric, p_description text default null, p_mitigation_strategy text default null, p_owner_id uuid default null, p_review_date date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_risk_level text;
  v_risk_score numeric;
  v_assessment_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'risk_insurance.assess') then
    raise exception 'insufficient permissions';
  end if;

  v_risk_score := p_likelihood * p_impact;

  if v_risk_score >= 15 then
    v_risk_level := 'critical';
  elsif v_risk_score >= 10 then
    v_risk_level := 'high';
  elsif v_risk_score >= 5 then
    v_risk_level := 'medium';
  else
    v_risk_level := 'low';
  end if;

  insert into public.risk_assessments (org_id, title, category, likelihood, impact, risk_score, risk_level, description, mitigation_strategy, owner_id, review_date, created_by)
  values (p_org_id, p_title, p_category, p_likelihood, p_impact, v_risk_score, v_risk_level, p_description, p_mitigation_strategy, p_owner_id, p_review_date, auth.uid())
  returning id into v_assessment_id;

  return v_assessment_id;
end;
$$;

create or replace function public.list_insurance_policies(p_org_id uuid, p_status text default null, p_policy_type text default null)
returns table (
  id uuid,
  policy_number text,
  policy_type text,
  insurer_name text,
  sum_insured numeric,
  premium numeric,
  start_date date,
  end_date date,
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
  if not public.has_permission(p_org_id, 'risk_insurance.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    ip.id,
    ip.policy_number,
    ip.policy_type,
    i.name as insurer_name,
    ip.sum_insured,
    ip.premium,
    ip.start_date,
    ip.end_date,
    ip.status
  from public.insurance_policies ip
  left join public.insurers i on ip.insurer_id = i.id
  where ip.org_id = p_org_id
    and (p_status is null or ip.status = p_status)
    and (p_policy_type is null or ip.policy_type = p_policy_type)
  order by ip.end_date asc;
end;
$$;
