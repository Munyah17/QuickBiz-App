-- POS module (spec §32): registers, cash-drawer sessions, and a fast
-- checkout flow. POS sales ARE sales_invoices/sales_invoice_items/
-- sales_payments (same canonical entities, spec §7's "single source of
-- truth") — a pos_session_id just tags which ones came from a POS shift,
-- for the register close-out (Z-report) summary. No new sale-creation RPC:
-- POS checkout calls the existing create_sales_invoice()/
-- record_sales_payment() RPCs back to back (both already permission- and
-- membership-checked), then tags the invoice with the session.

alter table public.sales_invoices
  add column pos_session_id uuid;

-- One register per branch, auto-provisioned the same way warehouses are
-- (spec doesn't require multi-register-per-branch yet, and exposing that
-- complexity in the UI before it's needed isn't worth it this pass).
create table if not exists public.pos_registers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id)
);

alter table public.pos_registers enable row level security;

create policy pos_registers_select on public.pos_registers
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: provisioned only by the branch trigger, same as warehouses.

create or replace function public.provision_branch_register()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pos_registers (org_id, branch_id, name)
  values (NEW.org_id, NEW.id, NEW.name || ' Register');
  return NEW;
end;
$$;

create trigger provision_branch_register
  after insert on public.branches
  for each row execute function public.provision_branch_register();

insert into public.pos_registers (org_id, branch_id, name)
select org_id, id, name || ' Register' from public.branches
on conflict (branch_id) do nothing;

create table if not exists public.pos_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  register_id uuid not null references public.pos_registers(id) on delete cascade,
  opened_by uuid references public.profiles(id) on delete set null,
  opening_float numeric(12, 2) not null default 0,
  closing_float numeric(12, 2),
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists pos_sessions_register_id_idx on public.pos_sessions (register_id);
create unique index if not exists pos_sessions_one_open_per_register
  on public.pos_sessions (register_id) where status = 'open';

alter table public.pos_sessions enable row level security;

create policy pos_sessions_select on public.pos_sessions
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: only open_pos_session()/close_pos_session() (below) can
-- touch this table, so a session can never be opened/closed without going
-- through the sales.manage permission check.

alter table public.sales_invoices
  add constraint sales_invoices_pos_session_fkey
  foreign key (pos_session_id) references public.pos_sessions(id) on delete set null;

create or replace function public.open_pos_session(p_org_id uuid, p_register_id uuid, p_opening_float numeric default 0)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.pos_sessions (org_id, register_id, opened_by, opening_float)
  values (p_org_id, p_register_id, auth.uid(), p_opening_float)
  returning id into v_session_id;

  return v_session_id;
exception
  when unique_violation then
    raise exception 'this register already has an open session';
end;
$$;

create or replace function public.close_pos_session(p_org_id uuid, p_session_id uuid, p_closing_float numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  update public.pos_sessions
  set status = 'closed', closing_float = p_closing_float, closed_at = now()
  where id = p_session_id and org_id = p_org_id and status = 'open';

  if not found then
    raise exception 'no open session found';
  end if;
end;
$$;

-- Tags an already-created invoice (from create_sales_invoice()) with the
-- POS session it belongs to. Separate step rather than a param on
-- create_sales_invoice() so non-POS invoice creation stays untouched.
create or replace function public.tag_invoice_pos_session(p_org_id uuid, p_invoice_id uuid, p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  update public.sales_invoices set pos_session_id = p_session_id
  where id = p_invoice_id and org_id = p_org_id;
end;
$$;
