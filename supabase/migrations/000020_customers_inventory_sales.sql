-- First real business modules: Customers (Core — always available, like
-- Branches/Users, per spec §6 listing "Contacts" as a platform-core
-- capability, not a toggleable module) and Inventory/Sales (genuine
-- business modules, gated behind org_modules.status = 'enabled' like every
-- other module in the catalog — see the Module Store real-toggle work that
-- follows this migration).

-- ============================================================
-- New permissions + backfill for orgs created before this migration
-- ============================================================
insert into public.permissions (key, label, category) values
  ('customers.manage', 'Manage customers', 'sales'),
  ('inventory.manage', 'Manage products and stock', 'inventory'),
  ('sales.manage', 'Create and manage sales invoices', 'sales')
on conflict (key) do nothing;

-- Existing orgs' Director/Manager/Team Leader roles were seeded before these
-- permissions existed — grant them the same way create_organization() (
-- redefined below) grants them to every new org, so nothing has to be
-- manually fixed per-tenant.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key in ('customers.manage', 'inventory.manage', 'sales.manage')
on conflict do nothing;

-- ============================================================
-- Customers (core capability, RLS mirrors branches: read open to any
-- member, write requires customers.manage)
-- ============================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  customer_type text not null default 'business' check (customer_type in ('individual', 'business')),
  email text,
  phone text,
  tax_number text,
  address jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  legacy_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_org_id_idx on public.customers (org_id);

alter table public.customers enable row level security;

create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create policy customers_select on public.customers
  for select using (org_id in (select public.user_org_ids()));

create policy customers_write on public.customers
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'customers.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'customers.manage'));

-- ============================================================
-- Generic parameterized audit trigger — audit_trigger() from 000010 always
-- writes module='core'; business-module tables want their own module tag.
-- ============================================================
create or replace function public.audit_trigger_with_module()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_entity_id uuid;
  v_module text := TG_ARGV[0];
begin
  if TG_OP = 'DELETE' then
    v_org_id := (to_jsonb(OLD) ->> 'org_id')::uuid;
    v_entity_id := OLD.id;
  else
    v_org_id := (to_jsonb(NEW) ->> 'org_id')::uuid;
    v_entity_id := NEW.id;
  end if;

  perform public.insert_audit_log(
    v_org_id, v_module, TG_TABLE_NAME, v_entity_id, lower(TG_OP),
    case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end
  );

  return coalesce(NEW, OLD);
end;
$$;

create trigger audit_customers
  after insert or update or delete on public.customers
  for each row execute function public.audit_trigger_with_module('sales');

-- ============================================================
-- Inventory module: categories, products, one auto-provisioned warehouse
-- per branch (schema supports multiple warehouses per branch later; the UI
-- doesn't expose that yet, so a 1:1 trigger keeps this pass simple without
-- losing the room to grow), stock levels, and an append-only stock ledger.
-- ============================================================
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

alter table public.product_categories enable row level security;

create policy product_categories_select on public.product_categories
  for select using (org_id in (select public.user_org_ids()));

create policy product_categories_write on public.product_categories
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'inventory.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'inventory.manage'));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  sku text not null,
  name text not null,
  description text,
  unit_of_measure text not null default 'each',
  cost_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  reorder_level numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, sku)
);

create index if not exists products_org_id_idx on public.products (org_id);

alter table public.products enable row level security;

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create policy products_select on public.products
  for select using (org_id in (select public.user_org_ids()));

create policy products_write on public.products
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'inventory.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'inventory.manage'));

create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.audit_trigger_with_module('inventory');

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id)
);

alter table public.warehouses enable row level security;

create policy warehouses_select on public.warehouses
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: warehouses are only ever created by the branch trigger
-- below, never directly by a client, since the UI doesn't expose a separate
-- warehouse concept this pass.

create or replace function public.provision_branch_warehouse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.warehouses (org_id, branch_id, name)
  values (NEW.org_id, NEW.id, NEW.name || ' Stock');
  return NEW;
end;
$$;

create trigger provision_branch_warehouse
  after insert on public.branches
  for each row execute function public.provision_branch_warehouse();

-- Backfill warehouses for branches created before this migration.
insert into public.warehouses (org_id, branch_id, name)
select org_id, id, name || ' Stock' from public.branches
on conflict (branch_id) do nothing;

create table if not exists public.stock_levels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity_on_hand numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id)
);

create index if not exists stock_levels_org_id_idx on public.stock_levels (org_id);

alter table public.stock_levels enable row level security;

create policy stock_levels_select on public.stock_levels
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: only adjust_stock()/create_sales_invoice() (both
-- SECURITY DEFINER, both check permissions themselves) touch this table, so
-- quantity_on_hand can never drift from the stock_movements ledger below.

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity_delta numeric(12, 2) not null,
  reason text not null check (reason in ('adjustment', 'sale', 'purchase', 'transfer_in', 'transfer_out')),
  reference text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_org_id_created_at_idx on public.stock_movements (org_id, created_at desc);

alter table public.stock_movements enable row level security;

create policy stock_movements_select on public.stock_movements
  for select using (org_id in (select public.user_org_ids()));

create or replace function public.adjust_stock(
  p_org_id uuid,
  p_product_id uuid,
  p_warehouse_id uuid,
  p_quantity_delta numeric,
  p_reason text,
  p_reference text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_qty numeric;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'inventory.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
  values (p_org_id, p_product_id, p_warehouse_id, p_quantity_delta)
  on conflict (product_id, warehouse_id)
  do update set quantity_on_hand = stock_levels.quantity_on_hand + excluded.quantity_on_hand, updated_at = now()
  returning quantity_on_hand into v_new_qty;

  insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
  values (p_org_id, p_product_id, p_warehouse_id, p_quantity_delta, p_reason, p_reference, auth.uid());

  return v_new_qty;
end;
$$;

-- ============================================================
-- Sales module: invoices, line items, payments.
-- ============================================================
create table if not exists public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  invoice_number text not null,
  status text not null default 'issued' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, invoice_number)
);

create index if not exists sales_invoices_org_id_idx on public.sales_invoices (org_id);

alter table public.sales_invoices enable row level security;

create trigger set_sales_invoices_updated_at
  before update on public.sales_invoices
  for each row execute function public.set_updated_at();

create policy sales_invoices_select on public.sales_invoices
  for select using (org_id in (select public.user_org_ids()));

create policy sales_invoices_write on public.sales_invoices
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sales.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sales.manage'));

create trigger audit_sales_invoices
  after insert or update or delete on public.sales_invoices
  for each row execute function public.audit_trigger_with_module('sales');

create table if not exists public.sales_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

create index if not exists sales_invoice_items_invoice_id_idx on public.sales_invoice_items (invoice_id);

alter table public.sales_invoice_items enable row level security;

create policy sales_invoice_items_select on public.sales_invoice_items
  for select using (
    invoice_id in (select id from public.sales_invoices where org_id in (select public.user_org_ids()))
  );

-- No write policy: items are only ever inserted by create_sales_invoice()
-- (SECURITY DEFINER), never edited directly, so an invoice's line items
-- always match the totals it was created with.

create table if not exists public.sales_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  amount numeric(12, 2) not null,
  method text not null default 'cash' check (method in ('cash', 'bank_transfer', 'mobile_money', 'card', 'other')),
  reference text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);

create index if not exists sales_payments_invoice_id_idx on public.sales_payments (invoice_id);

alter table public.sales_payments enable row level security;

create policy sales_payments_select on public.sales_payments
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: only record_sales_payment() (SECURITY DEFINER) inserts
-- these, since it also has to atomically bump sales_invoices.amount_paid.

-- next_number() (000009) never verified the caller belongs to target_org_id
-- — harmless until it's called from client-reachable code, which it now is
-- via create_sales_invoice(). Fixing here rather than leaving it live.
create or replace function public.next_number(target_org_id uuid, p_entity_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_number integer;
begin
  if target_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;

  insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
  values (target_org_id, p_entity_type, '', 1)
  on conflict (org_id, entity_type) do nothing;

  update public.numbering_sequences
  set next_number = next_number + 1
  where org_id = target_org_id and entity_type = p_entity_type
  returning prefix, next_number - 1 into v_prefix, v_number;

  return v_prefix || lpad(v_number::text, 6, '0');
end;
$$;

-- p_items: jsonb array of {product_id, description, quantity, unit_price}.
-- Tax is computed client-side (org_settings.tax.default_rate) and passed in
-- as a total rather than parsed here — this is an internal business tool
-- behind sales.manage, not an untrusted external boundary.
create or replace function public.create_sales_invoice(
  p_org_id uuid,
  p_branch_id uuid,
  p_customer_id uuid default null,
  p_warehouse_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_tax_total numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_invoice_number text;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_line_total numeric;
  v_product_id uuid;
  v_quantity numeric;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'an invoice needs at least one line item';
  end if;

  v_invoice_number := public.next_number(p_org_id, 'sales_invoice');

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
  end loop;

  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, notes, created_by)
  values
    (p_org_id, p_branch_id, p_customer_id, v_invoice_number, 'issued', v_subtotal, p_tax_total, v_subtotal + p_tax_total, p_notes, auth.uid())
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := (v_item ->> 'quantity')::numeric;

    insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
    values (v_invoice_id, v_product_id, v_item ->> 'description', v_quantity, (v_item ->> 'unit_price')::numeric, v_line_total);

    if v_product_id is not null and p_warehouse_id is not null then
      insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
      values (p_org_id, v_product_id, p_warehouse_id, -v_quantity)
      on conflict (product_id, warehouse_id)
      do update set quantity_on_hand = stock_levels.quantity_on_hand - v_quantity, updated_at = now();

      insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
      values (p_org_id, v_product_id, p_warehouse_id, -v_quantity, 'sale', v_invoice_number, auth.uid());
    end if;
  end loop;

  return v_invoice_id;
end;
$$;

create or replace function public.record_sales_payment(
  p_org_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null
)
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
  if p_amount <= 0 then
    raise exception 'payment amount must be positive';
  end if;

  insert into public.sales_payments (org_id, invoice_id, amount, method, reference, recorded_by)
  values (p_org_id, p_invoice_id, p_amount, p_method, p_reference, auth.uid());

  update public.sales_invoices
  set amount_paid = amount_paid + p_amount,
      status = case when amount_paid + p_amount >= total then 'paid' else status end
  where id = p_invoice_id and org_id = p_org_id;
end;
$$;

-- ============================================================
-- Redefine create_organization() once more (originally 000012, latest
-- 000017) to grant the three new permissions to Director/Manager/Team
-- Leader for every new org, matching the backfill above.
-- ============================================================
create or replace function public.create_organization(p_name text, p_branch_name text default 'Head Office')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_branch_id uuid;
  v_member_id uuid;
  v_role_owner uuid;
  v_role_director uuid;
  v_role_manager uuid;
  v_role_team_leader uuid;
  v_role_specialist uuid;
  v_role_general uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  insert into public.organizations (name) values (p_name) returning id into v_org_id;

  insert into public.branches (org_id, name, type)
  values (v_org_id, p_branch_name, 'head_office')
  returning id into v_branch_id;

  insert into public.org_members (org_id, user_id, branch_id, status)
  values (v_org_id, auth.uid(), v_branch_id, 'active')
  returning id into v_member_id;

  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'owner', 'Owner', true) returning id into v_role_owner;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'director', 'Director', true) returning id into v_role_director;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'manager', 'Manager', true) returning id into v_role_manager;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'team_leader', 'Team Leader', true) returning id into v_role_team_leader;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'specialist', 'Specialist', true) returning id into v_role_specialist;
  insert into public.roles (org_id, key, name, is_system) values
    (v_org_id, 'general', 'General', true) returning id into v_role_general;

  insert into public.role_permissions (role_id, permission_id)
  select v_role_owner, id from public.permissions;

  insert into public.role_permissions (role_id, permission_id)
  select v_role_director, id from public.permissions
  where key in (
    'org.manage', 'branches.manage', 'users.manage', 'settings.manage', 'audit.view',
    'customers.manage', 'inventory.manage', 'sales.manage'
  );

  insert into public.role_permissions (role_id, permission_id)
  select v_role_manager, id from public.permissions
  where key in (
    'branches.manage', 'users.manage', 'audit.view',
    'customers.manage', 'inventory.manage', 'sales.manage'
  );

  insert into public.role_permissions (role_id, permission_id)
  select v_role_team_leader, id from public.permissions
  where key in ('audit.view', 'customers.manage', 'inventory.manage', 'sales.manage');

  insert into public.user_roles (org_member_id, role_id) values (v_member_id, v_role_owner);

  insert into public.notifications (org_id, user_id, title, body, type)
  values (
    v_org_id, auth.uid(), 'Welcome to QuickBiz',
    p_name || ' is ready to go. Complete the one-time setup fee and enable the modules you need to activate billing.',
    'success'
  );

  return v_org_id;
end;
$$;
