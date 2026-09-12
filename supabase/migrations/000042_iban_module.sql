-- IBAN Module: each org can request its own IBAN for receiving
-- international payments. QuickBiz cannot mint a real IBAN itself - IBAN
-- allocation requires a licensed bank or virtual-IBAN/BaaS partner. This
-- module is deliberately scoped as a REQUEST + RECORD-KEEPING feature, not
-- an instant-generator: a request sits 'pending' until QuickBiz's own
-- platform staff manually confirm the real IBAN was issued by an actual
-- partner and populate it directly (via the service role, not any RPC
-- exposed to tenants) - there is no tenant-callable "approve" path, because
-- letting an org self-mint an "active" IBAN with arbitrary bank details it
-- typed in itself would be a fraud vector (a fabricated IBAN shown on an
-- invoice to a real international customer). See "don't invent things" -
-- same caution applied to Payroll's tax rates applies here to banking
-- infrastructure: build the real workflow, never fake the credential.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('iban', 'International Payments (IBAN)', 'Request your own IBAN to receive international payments. Provisioning happens through a banking/BaaS partner - once issued, your IBAN and its transaction history show here alongside your local payment methods.', 'finance', 25)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('iban.manage', 'Request and manage IBAN accounts', 'finance'),
  ('iban.view', 'View IBAN transactions and balances', 'finance')
on conflict (key) do nothing;

-- Banking/international-payment infrastructure is sensitive - restricted to
-- director/manager by default, not team_leader, matching Payroll's
-- treatment of compensation data in 000039.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('iban.manage', 'iban.view')
on conflict do nothing;

create table if not exists public.iban_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  iban text,
  bank_name text,
  bank_code text,
  account_number text,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'closed')),
  balance numeric(18, 2) not null default 0,
  available_balance numeric(18, 2) not null default 0,
  requested_by uuid references public.profiles(id) on delete set null,
  provisioned_at timestamptz,
  closed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists iban_accounts_org_id_idx on public.iban_accounts (org_id);
create index if not exists iban_accounts_status_idx on public.iban_accounts (status);

alter table public.iban_accounts enable row level security;

-- SELECT and write both gated by iban.view/iban.manage - this table can
-- hold real banking details once provisioned, materially more sensitive
-- than most operational data in this schema.
create policy iban_accounts_select on public.iban_accounts
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'iban.view'));

create policy iban_accounts_write on public.iban_accounts
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'iban.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'iban.manage'));

create trigger set_iban_accounts_updated_at
  before update on public.iban_accounts
  for each row execute function public.set_updated_at();

-- IBAN transactions - populated only once a real partner integration exists
-- to sync them (none does yet). No insert/update policy is defined here on
-- purpose: nothing in this app writes to this table today, so there is
-- nothing for a tenant (or anyone else) to legitimately insert.
create table if not exists public.iban_transactions (
  id uuid primary key default gen_random_uuid(),
  iban_account_id uuid not null references public.iban_accounts(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('credit', 'debit', 'fee')),
  amount numeric(18, 2) not null,
  currency text not null default 'EUR',
  description text,
  reference text,
  counterparty_iban text,
  counterparty_name text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'reversed')),
  value_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists iban_transactions_iban_account_id_idx on public.iban_transactions (iban_account_id);
create index if not exists iban_transactions_org_id_idx on public.iban_transactions (org_id);
create index if not exists iban_transactions_status_idx on public.iban_transactions (status);
create index if not exists iban_transactions_value_date_idx on public.iban_transactions (value_date);

alter table public.iban_transactions enable row level security;

create policy iban_transactions_select on public.iban_transactions
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'iban.view'));

-- RPC functions

create or replace function public.request_iban(p_org_id uuid, p_currency text default 'EUR', p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'iban.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.iban_accounts (org_id, currency, status, requested_by, notes)
  values (p_org_id, p_currency, 'pending', auth.uid(), p_notes)
  returning id into v_request_id;

  perform public.insert_audit_log(
    p_org_id, 'iban', 'iban_accounts', v_request_id, 'request',
    null, jsonb_build_object('currency', p_currency, 'notes', p_notes)
  );

  return jsonb_build_object('id', v_request_id, 'status', 'pending');
end;
$$;

create or replace function public.list_iban_accounts(p_org_id uuid)
returns table (
  id uuid,
  iban text,
  bank_name text,
  currency text,
  status text,
  balance numeric,
  available_balance numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'iban.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    id, iban, bank_name, currency, status,
    balance, available_balance, created_at
  from public.iban_accounts
  where org_id = p_org_id
  order by created_at desc;
end;
$$;

create or replace function public.list_iban_transactions(p_org_id uuid, p_iban_account_id uuid default null, p_limit int default 50)
returns table (
  id uuid,
  iban_account_id uuid,
  transaction_type text,
  amount numeric,
  currency text,
  description text,
  status text,
  value_date timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'iban.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select
    id, iban_account_id, transaction_type, amount, currency,
    description, status, value_date, created_at
  from public.iban_transactions
  where org_id = p_org_id
    and (p_iban_account_id is null or iban_account_id = p_iban_account_id)
  order by created_at desc
  limit p_limit;
end;
$$;
