-- CRM module: leads (pre-customer prospects) and opportunities (a
-- potential deal, tracked through a sales pipeline). A converted lead
-- becomes a real Customer (the canonical entity from 000020) rather than a
-- separate CRM-only contact record, keeping the single-source-of-truth
-- principle intact.

insert into public.permissions (key, label, category) values
  ('crm.manage', 'Manage leads and opportunities', 'sales')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'crm.manage'
on conflict do nothing;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  notes text,
  converted_customer_id uuid references public.customers(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_org_id_idx on public.leads (org_id);

alter table public.leads enable row level security;

create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create policy leads_select on public.leads
  for select using (org_id in (select public.user_org_ids()));

create policy leads_write on public.leads
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'crm.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'crm.manage'));

create trigger audit_leads
  after insert or update or delete on public.leads
  for each row execute function public.audit_trigger_with_module('crm');

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  name text not null,
  stage text not null default 'prospecting'
    check (stage in ('prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost')),
  value numeric(12, 2) not null default 0,
  expected_close_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_org_id_idx on public.opportunities (org_id);

alter table public.opportunities enable row level security;

create trigger set_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create policy opportunities_select on public.opportunities
  for select using (org_id in (select public.user_org_ids()));

create policy opportunities_write on public.opportunities
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'crm.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'crm.manage'));

create trigger audit_opportunities
  after insert or update or delete on public.opportunities
  for each row execute function public.audit_trigger_with_module('crm');

-- Converts a lead into a real Customer (single source of truth) and marks
-- the lead 'converted', linking back to the new customer row.
create or replace function public.convert_lead_to_customer(p_org_id uuid, p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead record;
  v_customer_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'crm.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_lead from public.leads where id = p_lead_id and org_id = p_org_id;
  if v_lead is null then
    raise exception 'lead not found';
  end if;

  insert into public.customers (org_id, name, email, phone, customer_type)
  values (p_org_id, coalesce(v_lead.company, v_lead.name), v_lead.email, v_lead.phone, 'business')
  returning id into v_customer_id;

  update public.leads set status = 'converted', converted_customer_id = v_customer_id
  where id = p_lead_id and org_id = p_org_id;

  return v_customer_id;
end;
$$;
