-- Purchasing module (spec: Suppliers, Purchase Orders, Goods Received,
-- Supplier Invoices). Unlike Customers, Suppliers is module-gated (not
-- Core) — it's specifically a procurement concern, not referenced across
-- Sales/CRM/POS the way Customers is (spec §7's canonical-entity list).
-- Mirrors the Sales module's shape: suppliers ~ customers, purchase_orders
-- ~ sales_invoices, receiving stock ~ selling stock (same stock_levels/
-- stock_movements ledger, opposite sign).

insert into public.permissions (key, label, category) values
  ('purchasing.manage', 'Manage suppliers and purchase orders', 'purchasing')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'purchasing.manage'
on conflict do nothing;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tax_number text,
  address jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_org_id_idx on public.suppliers (org_id);

alter table public.suppliers enable row level security;

create trigger set_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

create policy suppliers_select on public.suppliers
  for select using (org_id in (select public.user_org_ids()));

create policy suppliers_write on public.suppliers
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'purchasing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'purchasing.manage'));

create trigger audit_suppliers
  after insert or update or delete on public.suppliers
  for each row execute function public.audit_trigger_with_module('purchasing');

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  po_number text not null,
  status text not null default 'draft' check (status in ('draft', 'issued', 'received', 'cancelled')),
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  received_at timestamptz,
  unique (org_id, po_number)
);

create index if not exists purchase_orders_org_id_idx on public.purchase_orders (org_id);

alter table public.purchase_orders enable row level security;

create trigger set_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

create policy purchase_orders_select on public.purchase_orders
  for select using (org_id in (select public.user_org_ids()));

create policy purchase_orders_write on public.purchase_orders
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'purchasing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'purchasing.manage'));

create trigger audit_purchase_orders
  after insert or update or delete on public.purchase_orders
  for each row execute function public.audit_trigger_with_module('purchasing');

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_cost numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

create index if not exists purchase_order_items_po_id_idx on public.purchase_order_items (po_id);

alter table public.purchase_order_items enable row level security;

create policy purchase_order_items_select on public.purchase_order_items
  for select using (
    po_id in (select id from public.purchase_orders where org_id in (select public.user_org_ids()))
  );

-- No write policy: only create_purchase_order() (SECURITY DEFINER) inserts these.

create table if not exists public.purchase_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  po_id uuid not null references public.purchase_orders(id) on delete cascade,
  amount numeric(12, 2) not null,
  method text not null default 'bank_transfer' check (method in ('cash', 'bank_transfer', 'mobile_money', 'card', 'other')),
  reference text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);

create index if not exists purchase_payments_po_id_idx on public.purchase_payments (po_id);

alter table public.purchase_payments enable row level security;

create policy purchase_payments_select on public.purchase_payments
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: only record_purchase_payment() (SECURITY DEFINER).

create or replace function public.create_purchase_order(
  p_org_id uuid,
  p_branch_id uuid,
  p_supplier_id uuid default null,
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
  v_po_id uuid;
  v_po_number text;
  v_subtotal numeric := 0;
  v_item jsonb;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'purchasing.manage') then
    raise exception 'insufficient permissions';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'a purchase order needs at least one line item';
  end if;

  v_po_number := public.next_number(p_org_id, 'purchase_order');

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_cost')::numeric;
  end loop;

  insert into public.purchase_orders (org_id, branch_id, supplier_id, po_number, status, subtotal, tax_total, total, notes, created_by)
  values (p_org_id, p_branch_id, p_supplier_id, v_po_number, 'issued', v_subtotal, p_tax_total, v_subtotal + p_tax_total, p_notes, auth.uid())
  returning id into v_po_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.purchase_order_items (po_id, product_id, description, quantity, unit_cost, line_total)
    values (
      v_po_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      v_item ->> 'description',
      (v_item ->> 'quantity')::numeric,
      (v_item ->> 'unit_cost')::numeric,
      (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_cost')::numeric
    );
  end loop;

  return v_po_id;
end;
$$;

-- Marks a PO received and adds the ordered quantities to stock at the given
-- warehouse — the inbound mirror of create_sales_invoice()'s stock deduction.
create or replace function public.receive_purchase_order(p_org_id uuid, p_po_id uuid, p_warehouse_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_po_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'purchasing.manage') then
    raise exception 'insufficient permissions';
  end if;

  select po_number into v_po_number from public.purchase_orders where id = p_po_id and org_id = p_org_id;
  if v_po_number is null then
    raise exception 'purchase order not found';
  end if;

  for v_item in
    select product_id, quantity from public.purchase_order_items where po_id = p_po_id and product_id is not null
  loop
    insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
    values (p_org_id, v_item.product_id, p_warehouse_id, v_item.quantity)
    on conflict (product_id, warehouse_id)
    do update set quantity_on_hand = stock_levels.quantity_on_hand + v_item.quantity, updated_at = now();

    insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
    values (p_org_id, v_item.product_id, p_warehouse_id, v_item.quantity, 'purchase', v_po_number, auth.uid());
  end loop;

  update public.purchase_orders set status = 'received', received_at = now()
  where id = p_po_id and org_id = p_org_id;
end;
$$;

create or replace function public.record_purchase_payment(
  p_org_id uuid,
  p_po_id uuid,
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
  if not public.has_permission(p_org_id, 'purchasing.manage') then
    raise exception 'insufficient permissions';
  end if;
  if p_amount <= 0 then
    raise exception 'payment amount must be positive';
  end if;

  insert into public.purchase_payments (org_id, po_id, amount, method, reference, recorded_by)
  values (p_org_id, p_po_id, p_amount, p_method, p_reference, auth.uid());

  update public.purchase_orders set amount_paid = amount_paid + p_amount
  where id = p_po_id and org_id = p_org_id;
end;
$$;
