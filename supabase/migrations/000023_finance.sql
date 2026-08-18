-- Finance module, scoped honestly: a chart of accounts and expense tracking
-- (both real, full CRUD) plus a P&L computed from data that already exists
-- (sales_invoices for revenue, products.cost_price for COGS, expenses for
-- operating costs). Full double-entry general ledger / bank reconciliation
-- / trial balance (spec's fuller Finance list) is real enterprise-accounting
-- complexity out of scope for this pass — this gives genuine value (a real
-- P&L, not a fake one) without pretending a GL exists.

insert into public.permissions (key, label, category) values
  ('finance.manage', 'Manage chart of accounts and expenses', 'finance')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'finance.manage'
on conflict do nothing;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);

create index if not exists accounts_org_id_idx on public.accounts (org_id);

alter table public.accounts enable row level security;

create policy accounts_select on public.accounts
  for select using (org_id in (select public.user_org_ids()));

create policy accounts_write on public.accounts
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'));

create trigger audit_accounts
  after insert or update or delete on public.accounts
  for each row execute function public.audit_trigger_with_module('finance');

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null,
  expense_date date not null default current_date,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank_transfer', 'mobile_money', 'card', 'other')),
  reference text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_org_id_date_idx on public.expenses (org_id, expense_date desc);

alter table public.expenses enable row level security;

create policy expenses_select on public.expenses
  for select using (org_id in (select public.user_org_ids()));

create policy expenses_write on public.expenses
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'));

create trigger audit_expenses
  after insert or update or delete on public.expenses
  for each row execute function public.audit_trigger_with_module('finance');

-- One-click standard chart of accounts, idempotent (does nothing if the org
-- already has accounts) — a real setup action, not pre-seeded mystery data.
create or replace function public.seed_default_accounts(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'finance.manage') then
    raise exception 'insufficient permissions';
  end if;

  if exists (select 1 from public.accounts where org_id = p_org_id) then
    return;
  end if;

  insert into public.accounts (org_id, code, name, type) values
    (p_org_id, '1000', 'Cash', 'asset'),
    (p_org_id, '1010', 'Bank Account', 'asset'),
    (p_org_id, '1100', 'Accounts Receivable', 'asset'),
    (p_org_id, '1200', 'Inventory', 'asset'),
    (p_org_id, '2000', 'Accounts Payable', 'liability'),
    (p_org_id, '3000', 'Owner''s Equity', 'equity'),
    (p_org_id, '4000', 'Sales Revenue', 'income'),
    (p_org_id, '5000', 'Cost of Goods Sold', 'expense'),
    (p_org_id, '5100', 'Rent', 'expense'),
    (p_org_id, '5200', 'Salaries & Wages', 'expense'),
    (p_org_id, '5300', 'Utilities', 'expense'),
    (p_org_id, '5400', 'Office Supplies', 'expense'),
    (p_org_id, '5500', 'Marketing', 'expense'),
    (p_org_id, '5600', 'Transport & Travel', 'expense'),
    (p_org_id, '5700', 'Bank Charges', 'expense'),
    (p_org_id, '5900', 'Other Expenses', 'expense');
end;
$$;
