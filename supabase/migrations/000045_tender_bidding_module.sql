-- Tender Bidding Module: create tenders when sourcing suppliers, receive
-- and evaluate bids, track the tender lifecycle through to award.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('tender_bidding', 'Tender Bidding', 'Manage tender creation, supplier bidding, and procurement processes. Create tenders when seeking suppliers, receive and evaluate bids, and track the entire tender lifecycle.', 'procurement', 25)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('tender_bidding.manage', 'Create and manage tenders', 'procurement'),
  ('tender_bidding.evaluate', 'Evaluate and award tenders', 'procurement'),
  ('tender_bidding.view', 'View tenders and bids', 'procurement'),
  ('tender_bidding.bid', 'Submit bids on behalf of a supplier', 'procurement')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('tender_bidding.manage', 'tender_bidding.evaluate', 'tender_bidding.view', 'tender_bidding.bid')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('tender_bidding.view', 'tender_bidding.bid')
on conflict do nothing;

create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tender_number text not null,
  title text not null,
  description text,
  category text,
  budget numeric(18, 2),
  currency text not null default 'USD',
  issue_date date not null,
  closing_date date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'awarded', 'cancelled')),
  award_date date,
  -- A tender's winner is a supplier/vendor, not a customer.
  awarded_to uuid references public.suppliers(id) on delete set null,
  award_amount numeric(18, 2),
  requirements jsonb default '[]'::jsonb,
  evaluation_criteria jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, tender_number)
);

create index if not exists tenders_org_id_idx on public.tenders (org_id);
create index if not exists tenders_status_idx on public.tenders (status);
create index if not exists tenders_closing_date_idx on public.tenders (closing_date);

alter table public.tenders enable row level security;

create policy tenders_select on public.tenders
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy tenders_insert on public.tenders
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tender_bidding.manage'));

create policy tenders_update on public.tenders
  for update to authenticated
  using (
    org_id in (select public.user_org_ids())
    and (public.has_permission(org_id, 'tender_bidding.manage') or public.has_permission(org_id, 'tender_bidding.evaluate'))
  );

create trigger set_tenders_updated_at
  before update on public.tenders
  for each row execute function public.set_updated_at();

create table if not exists public.tender_bids (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.tenders(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  bid_number text not null,
  amount numeric(18, 2) not null,
  currency text not null default 'USD',
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'shortlisted', 'rejected', 'awarded', 'withdrawn')),
  submitted_at timestamptz not null default now(),
  proposal_document text,
  technical_score numeric(5, 2),
  commercial_score numeric(5, 2),
  total_score numeric(5, 2),
  evaluation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tender_bids_tender_id_idx on public.tender_bids (tender_id);
create index if not exists tender_bids_org_id_idx on public.tender_bids (org_id);
create index if not exists tender_bids_supplier_id_idx on public.tender_bids (supplier_id);
create index if not exists tender_bids_status_idx on public.tender_bids (status);

alter table public.tender_bids enable row level security;

create policy tender_bids_select on public.tender_bids
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy tender_bids_insert on public.tender_bids
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tender_bidding.bid'));

create policy tender_bids_update on public.tender_bids
  for update to authenticated
  using (
    org_id in (select public.user_org_ids())
    and (public.has_permission(org_id, 'tender_bidding.manage') or public.has_permission(org_id, 'tender_bidding.evaluate'))
  );

create trigger set_tender_bids_updated_at
  before update on public.tender_bids
  for each row execute function public.set_updated_at();

create table if not exists public.tender_documents (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.tenders(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null check (document_type in ('specification', 'terms', 'evaluation', 'other')),
  title text not null,
  file_url text not null,
  file_size numeric,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tender_documents_tender_id_idx on public.tender_documents (tender_id);

alter table public.tender_documents enable row level security;

create policy tender_documents_select on public.tender_documents
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy tender_documents_insert on public.tender_documents
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'tender_bidding.manage'));

-- RPC functions

create or replace function public.create_tender(p_org_id uuid, p_tender_number text, p_title text, p_description text, p_category text, p_budget numeric, p_closing_date date, p_requirements jsonb default '[]'::jsonb, p_evaluation_criteria jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tender_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'tender_bidding.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.tenders (org_id, tender_number, title, description, category, budget, issue_date, closing_date, requirements, evaluation_criteria, created_by)
  values (p_org_id, p_tender_number, p_title, p_description, p_category, p_budget, current_date, p_closing_date, p_requirements, p_evaluation_criteria, auth.uid())
  returning id into v_tender_id;

  return v_tender_id;
end;
$$;

create or replace function public.submit_tender_bid(p_tender_id uuid, p_supplier_id uuid, p_amount numeric, p_proposal_document text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tender_org_id uuid;
  v_bid_id uuid;
  v_bid_number text;
begin
  select org_id into v_tender_org_id from public.tenders where id = p_tender_id;

  if v_tender_org_id is null then
    raise exception 'Tender not found';
  end if;

  if v_tender_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_tender_org_id, 'tender_bidding.bid') then
    raise exception 'insufficient permissions';
  end if;

  v_bid_number := 'BID-' || upper(substr(gen_random_uuid()::text, 1, 8));

  insert into public.tender_bids (tender_id, org_id, supplier_id, bid_number, amount, proposal_document)
  values (p_tender_id, v_tender_org_id, p_supplier_id, v_bid_number, p_amount, p_proposal_document)
  returning id into v_bid_id;

  return v_bid_id;
end;
$$;

create or replace function public.evaluate_tender_bid(p_bid_id uuid, p_technical_score numeric, p_commercial_score numeric, p_evaluation_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.tender_bids where id = p_bid_id;

  if v_org_id is null then
    raise exception 'Bid not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'tender_bidding.evaluate') then
    raise exception 'insufficient permissions';
  end if;

  update public.tender_bids
  set
    technical_score = p_technical_score,
    commercial_score = p_commercial_score,
    total_score = p_technical_score + p_commercial_score,
    evaluation_notes = p_evaluation_notes,
    status = 'under_review'
  where id = p_bid_id;
end;
$$;

create or replace function public.award_tender(p_tender_id uuid, p_bid_id uuid, p_award_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_supplier_id uuid;
begin
  select org_id into v_org_id from public.tenders where id = p_tender_id;

  if v_org_id is null then
    raise exception 'Tender not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'tender_bidding.evaluate') then
    raise exception 'insufficient permissions';
  end if;

  select supplier_id into v_supplier_id from public.tender_bids where id = p_bid_id;

  update public.tenders
  set
    status = 'awarded',
    awarded_to = v_supplier_id,
    award_amount = p_award_amount,
    award_date = current_date
  where id = p_tender_id;

  update public.tender_bids
  set status = 'awarded'
  where id = p_bid_id;

  update public.tender_bids
  set status = 'rejected'
  where tender_id = p_tender_id and id != p_bid_id;
end;
$$;

create or replace function public.list_tenders(p_org_id uuid, p_status text default null, p_limit int default 50)
returns table (
  id uuid,
  tender_number text,
  title text,
  status text,
  closing_date date,
  budget numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'tender_bidding.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select id, tender_number, title, status, closing_date, budget
  from public.tenders
  where org_id = p_org_id
    and (p_status is null or status = p_status)
  order by created_at desc
  limit p_limit;
end;
$$;
