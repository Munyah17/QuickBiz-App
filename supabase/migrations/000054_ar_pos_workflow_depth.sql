-- Depth pass on the money flow: real invoice lifecycle (due dates, drafts
-- that get issued, partial payments, discounts, voids, credit notes),
-- customer credit terms, an expense approval workflow, POS held orders, and
-- event-driven notifications (low stock crossing, overdue invoices, pending
-- approvals) so the platform tells staff what needs attention instead of
-- waiting to be asked.
--
-- Also fixes a real bug: sales_payments.method only allowed 5 generic
-- values while the POS/checkout UI offers Zimbabwe's actual payment rails
-- (ecocash, zipit, zimswitch, ...) — any non-generic tender failed the
-- check constraint and the sale could not be completed.

-- ============================================================
-- Shared: the canonical payment-method list, now used by
-- sales_payments and (re-stated for) expenses. 'mobile_money' stays for
-- back-compat with rows written before the local rails were named.
-- ============================================================
alter table public.sales_payments drop constraint if exists sales_payments_method_check;
alter table public.sales_payments add constraint sales_payments_method_check
  check (method in (
    'cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney',
    'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast',
    'card', 'mobile_money', 'credit_note', 'other'
  ));

-- ============================================================
-- Sales invoices: lifecycle + credit terms
-- ============================================================
alter table public.sales_invoices
  add column if not exists due_date date,
  add column if not exists issued_at timestamptz,
  add column if not exists discount_total numeric(12, 2) not null default 0,
  add column if not exists discount_reason text,
  add column if not exists overdue_notified_at timestamptz;

alter table public.sales_invoices drop constraint if exists sales_invoices_status_check;
alter table public.sales_invoices add constraint sales_invoices_status_check
  check (status in ('draft', 'issued', 'partially_paid', 'paid', 'cancelled'));

-- Existing non-draft invoices were always effectively "issued" at creation.
update public.sales_invoices set issued_at = created_at
where issued_at is null and status <> 'draft';

create index if not exists sales_invoices_org_due_date_idx
  on public.sales_invoices (org_id, due_date) where status <> 'cancelled';

-- ============================================================
-- Customers: credit terms for AR
-- ============================================================
alter table public.customers
  add column if not exists credit_limit numeric(12, 2),
  add column if not exists payment_terms_days integer,
  add column if not exists notes text;

-- ============================================================
-- create_sales_invoice: due date, discount, draft support.
-- Signature grows with defaulted params so existing callers (POS checkout,
-- seed) keep working unchanged.
-- ============================================================
create or replace function public.create_sales_invoice(
  p_org_id uuid,
  p_branch_id uuid,
  p_customer_id uuid default null,
  p_warehouse_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_tax_total numeric default 0,
  p_notes text default null,
  p_due_date date default null,
  p_discount_total numeric default 0,
  p_discount_reason text default null,
  p_status text default 'issued'
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
  v_customer record;
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
  if p_status not in ('draft', 'issued') then
    raise exception 'invoices can only be created as draft or issued';
  end if;
  if p_discount_total < 0 then
    raise exception 'discount cannot be negative';
  end if;

  -- Credit-limit enforcement on issued invoices (drafts don't commit the
  -- customer yet, so they skip the check — it re-fires on issue_invoice()).
  if p_status = 'issued' and p_customer_id is not null then
    select credit_limit into v_customer from public.customers where id = p_customer_id;
    if v_customer.credit_limit is not null then
      declare
        v_open_balance numeric;
        v_new_total numeric;
      begin
        select coalesce(sum(total - amount_paid), 0) into v_open_balance
        from public.sales_invoices
        where customer_id = p_customer_id and status in ('issued', 'partially_paid');
        v_new_total := 0;
        for v_item in select * from jsonb_array_elements(p_items) loop
          v_new_total := v_new_total + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
        end loop;
        v_new_total := v_new_total + p_tax_total - p_discount_total;
        if v_open_balance + v_new_total > v_customer.credit_limit then
          raise exception 'invoice would exceed the customer credit limit (open balance % + % > limit %)',
            v_open_balance, v_new_total, v_customer.credit_limit;
        end if;
      end;
    end if;
  end if;

  v_invoice_number := public.next_number(p_org_id, 'sales_invoice');

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
  end loop;

  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total,
     discount_total, discount_reason, total, notes, due_date, issued_at, created_by)
  values
    (p_org_id, p_branch_id, p_customer_id, v_invoice_number, p_status, v_subtotal, p_tax_total,
     p_discount_total, nullif(p_discount_reason, ''), v_subtotal + p_tax_total - p_discount_total,
     p_notes, p_due_date, case when p_status = 'issued' then now() else null end, auth.uid())
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := (v_item ->> 'quantity')::numeric;

    insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
    values (v_invoice_id, v_product_id, v_item ->> 'description', v_quantity, (v_item ->> 'unit_price')::numeric, v_line_total);

    -- Stock only moves once the invoice is real (issued), not while it's a draft.
    if p_status = 'issued' and v_product_id is not null and p_warehouse_id is not null then
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

-- ============================================================
-- record_sales_payment: partial payments now get their own status.
-- ============================================================
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
      status = case
        when amount_paid + p_amount >= total then 'paid'
        else 'partially_paid'
      end
  where id = p_invoice_id and org_id = p_org_id;
end;
$$;

-- ============================================================
-- issue_invoice: draft -> issued. Moves the stock that was withheld at
-- draft time and runs the credit-limit check create_sales_invoice skipped.
-- ============================================================
create or replace function public.issue_invoice(p_org_id uuid, p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice record;
  v_item record;
  v_warehouse_id uuid;
  v_open_balance numeric;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_invoice from public.sales_invoices
  where id = p_invoice_id and org_id = p_org_id;
  if not found then
    raise exception 'invoice not found';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'only draft invoices can be issued';
  end if;

  if v_invoice.customer_id is not null then
    declare
      v_credit_limit numeric;
    begin
      select credit_limit into v_credit_limit from public.customers where id = v_invoice.customer_id;
      if v_credit_limit is not null then
        select coalesce(sum(total - amount_paid), 0) into v_open_balance
        from public.sales_invoices
        where customer_id = v_invoice.customer_id and status in ('issued', 'partially_paid');
        if v_open_balance + v_invoice.total > v_credit_limit then
          raise exception 'issuing this invoice would exceed the customer credit limit';
        end if;
      end if;
    end;
  end if;

  -- Resolve the branch warehouse the same way the POS does (one warehouse
  -- per branch — provision_branch_warehouse keeps that invariant).
  select id into v_warehouse_id from public.warehouses
  where org_id = p_org_id and branch_id = v_invoice.branch_id
  limit 1;

  if v_warehouse_id is not null then
    for v_item in
      select product_id, quantity from public.sales_invoice_items
      where invoice_id = p_invoice_id and product_id is not null
    loop
      insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
      values (p_org_id, v_item.product_id, v_warehouse_id, -v_item.quantity)
      on conflict (product_id, warehouse_id)
      do update set quantity_on_hand = stock_levels.quantity_on_hand - v_item.quantity, updated_at = now();

      insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
      values (p_org_id, v_item.product_id, v_warehouse_id, -v_item.quantity, 'sale', v_invoice.invoice_number, auth.uid());
    end loop;
  end if;

  update public.sales_invoices
  set status = 'issued', issued_at = now()
  where id = p_invoice_id;
end;
$$;

-- ============================================================
-- void_invoice: cancel an issued/partially_paid invoice. Restocks the
-- items and keeps a cancelled audit trail (never delete money records).
-- ============================================================
create or replace function public.void_invoice(p_org_id uuid, p_invoice_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice record;
  v_item record;
  v_warehouse_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_invoice from public.sales_invoices
  where id = p_invoice_id and org_id = p_org_id;
  if not found then
    raise exception 'invoice not found';
  end if;
  if v_invoice.status in ('paid', 'cancelled') then
    raise exception 'a % invoice cannot be voided', v_invoice.status;
  end if;
  if v_invoice.amount_paid > 0 then
    raise exception 'refund recorded payments before voiding';
  end if;

  -- Restock only when the invoice had actually taken stock (issued+),
  -- drafts never moved inventory.
  if v_invoice.status in ('issued', 'partially_paid') then
    select id into v_warehouse_id from public.warehouses
    where org_id = p_org_id and branch_id = v_invoice.branch_id
    limit 1;

    if v_warehouse_id is not null then
      for v_item in
        select product_id, quantity from public.sales_invoice_items
        where invoice_id = p_invoice_id and product_id is not null
      loop
        insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
        values (p_org_id, v_item.product_id, v_warehouse_id, v_item.quantity)
        on conflict (product_id, warehouse_id)
        do update set quantity_on_hand = stock_levels.quantity_on_hand + v_item.quantity, updated_at = now();

        insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
        values (p_org_id, v_item.product_id, v_warehouse_id, v_item.quantity, 'adjustment',
                'void ' || v_invoice.invoice_number, auth.uid());
      end loop;
    end if;
  end if;

  update public.sales_invoices
  set status = 'cancelled',
      notes = case when p_reason is not null and length(p_reason) > 0
                   then coalesce(notes || e'\n', '') || 'Voided: ' || p_reason
                   else notes end
  where id = p_invoice_id;
end;
$$;

-- ============================================================
-- Credit notes: product returns / invoice corrections. Applying one
-- restocks the goods and settles (part of) the invoice balance as a
-- credit_note "payment", so AR stays consistent with the ledger.
-- ============================================================
create table if not exists public.sales_credit_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  credit_note_number text not null,
  reason text,
  subtotal numeric(12, 2) not null default 0,
  restock boolean not null default true,
  status text not null default 'issued' check (status in ('issued', 'applied', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, credit_note_number)
);

create index if not exists sales_credit_notes_invoice_idx on public.sales_credit_notes (invoice_id);

alter table public.sales_credit_notes enable row level security;

create policy sales_credit_notes_select on public.sales_credit_notes
  for select using (org_id in (select public.user_org_ids()));

create trigger audit_sales_credit_notes
  after insert or update or delete on public.sales_credit_notes
  for each row execute function public.audit_trigger_with_module('sales');

create table if not exists public.sales_credit_note_items (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.sales_credit_notes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

create index if not exists sales_credit_note_items_cn_idx on public.sales_credit_note_items (credit_note_id);

alter table public.sales_credit_note_items enable row level security;

create policy sales_credit_note_items_select on public.sales_credit_note_items
  for select using (
    credit_note_id in (select id from public.sales_credit_notes where org_id in (select public.user_org_ids()))
  );

-- p_items: jsonb array of {product_id, description, quantity, unit_price}
-- p_restock: put returned goods back into the branch warehouse.
create or replace function public.create_credit_note(
  p_org_id uuid,
  p_invoice_id uuid,
  p_items jsonb,
  p_reason text default null,
  p_restock boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice record;
  v_credit_note_id uuid;
  v_cn_number text;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_warehouse_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'a credit note needs at least one line item';
  end if;

  select * into v_invoice from public.sales_invoices
  where id = p_invoice_id and org_id = p_org_id;
  if not found then
    raise exception 'invoice not found';
  end if;
  if v_invoice.status in ('draft', 'cancelled') then
    raise exception 'credit notes apply to issued invoices, not %', v_invoice.status;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
  end loop;
  if v_subtotal > v_invoice.total then
    raise exception 'credit note total (%) exceeds the invoice total (%)', v_subtotal, v_invoice.total;
  end if;

  v_cn_number := public.next_number(p_org_id, 'sales_credit_note');

  insert into public.sales_credit_notes
    (org_id, invoice_id, credit_note_number, reason, subtotal, restock, created_by)
  values
    (p_org_id, p_invoice_id, v_cn_number, p_reason, v_subtotal, p_restock, auth.uid())
  returning id into v_credit_note_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.sales_credit_note_items (credit_note_id, product_id, description, quantity, unit_price, line_total)
    values (
      v_credit_note_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      v_item ->> 'description',
      (v_item ->> 'quantity')::numeric,
      (v_item ->> 'unit_price')::numeric,
      (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric
    );
  end loop;

  if p_restock then
    select id into v_warehouse_id from public.warehouses
    where org_id = p_org_id and branch_id = v_invoice.branch_id
    limit 1;

    if v_warehouse_id is not null then
      for v_item in select * from jsonb_array_elements(p_items) loop
        if nullif(v_item ->> 'product_id', '') is not null then
          insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
          values (p_org_id, (v_item ->> 'product_id')::uuid, v_warehouse_id, (v_item ->> 'quantity')::numeric)
          on conflict (product_id, warehouse_id)
          do update set quantity_on_hand = stock_levels.quantity_on_hand + (v_item ->> 'quantity')::numeric, updated_at = now();

          insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
          values (p_org_id, (v_item ->> 'product_id')::uuid, v_warehouse_id, (v_item ->> 'quantity')::numeric,
                  'adjustment', 'return ' || v_cn_number, auth.uid());
        end if;
      end loop;
    end if;
  end if;

  return v_credit_note_id;
end;
$$;

-- Applies a credit note to its invoice: records the credit as a
-- credit_note payment so amount_paid/balance stay truthful, and flips the
-- note to 'applied'. Refunds to the customer are recorded separately by
-- the business (the note settles the receivable, not cash).
create or replace function public.apply_credit_note(p_org_id uuid, p_credit_note_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn record;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_cn from public.sales_credit_notes
  where id = p_credit_note_id and org_id = p_org_id;
  if not found then
    raise exception 'credit note not found';
  end if;
  if v_cn.status <> 'issued' then
    raise exception 'only issued credit notes can be applied';
  end if;

  perform public.record_sales_payment(p_org_id, v_cn.invoice_id, v_cn.subtotal, 'credit_note', v_cn.credit_note_number);

  update public.sales_credit_notes set status = 'applied' where id = p_credit_note_id;
end;
$$;

-- ============================================================
-- Expense approval workflow. Existing rows were already "money out", so
-- they backfill to 'paid'; new submissions start at 'submitted' and need
-- an expenses.approve holder to approve + mark paid.
-- ============================================================
insert into public.permissions (key, label, category) values
  ('expenses.approve', 'Approve expense claims', 'finance')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('owner', 'director', 'manager')
  and p.key = 'expenses.approve'
on conflict do nothing;

alter table public.expenses
  add column if not exists status text not null default 'submitted',
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.expenses drop constraint if exists expenses_status_check;
alter table public.expenses add constraint expenses_status_check
  check (status in ('submitted', 'approved', 'rejected', 'paid'));

-- Pre-existing rows were real money already spent.
update public.expenses set status = 'paid' where status = 'submitted';
update public.expenses set submitted_by = created_by, submitted_at = created_at where submitted_at is null;

create or replace function public.approve_expense(p_org_id uuid, p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'expenses.approve') then
    raise exception 'insufficient permissions';
  end if;

  update public.expenses
  set status = 'approved', approved_by = auth.uid(), approved_at = now()
  where id = p_expense_id and org_id = p_org_id and status = 'submitted';
  if not found then
    raise exception 'no submitted expense found with that id';
  end if;
end;
$$;

create or replace function public.reject_expense(p_org_id uuid, p_expense_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'expenses.approve') then
    raise exception 'insufficient permissions';
  end if;

  update public.expenses
  set status = 'rejected', approved_by = auth.uid(), approved_at = now(), rejection_reason = p_reason
  where id = p_expense_id and org_id = p_org_id and status = 'submitted';
  if not found then
    raise exception 'no submitted expense found with that id';
  end if;
end;
$$;

create or replace function public.mark_expense_paid(p_org_id uuid, p_expense_id uuid, p_payment_method text, p_reference text default null)
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

  update public.expenses
  set status = 'paid', payment_method = coalesce(p_payment_method, payment_method), reference = coalesce(p_reference, reference)
  where id = p_expense_id and org_id = p_org_id and status = 'approved';
  if not found then
    raise exception 'no approved expense found with that id';
  end if;
end;
$$;

-- ============================================================
-- POS held orders: park a cart against the open register session and
-- resume it later (or from another till). Plain RLS writes — holds are
-- UI state, not financial records.
-- ============================================================
create table if not exists public.pos_held_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null references public.pos_sessions(id) on delete cascade,
  register_id uuid not null references public.pos_registers(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  label text,
  cart jsonb not null default '[]'::jsonb,
  held_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pos_held_orders_session_idx on public.pos_held_orders (session_id);

alter table public.pos_held_orders enable row level security;

create trigger set_pos_held_orders_updated_at
  before update on public.pos_held_orders
  for each row execute function public.set_updated_at();

create policy pos_held_orders_select on public.pos_held_orders
  for select using (org_id in (select public.user_org_ids()));

create policy pos_held_orders_write on public.pos_held_orders
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sales.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'sales.manage'));

-- ============================================================
-- Notification engine: one helper every event goes through, so the
-- "who gets told" rule (active members holding a given permission)
-- lives in exactly one place.
-- ============================================================
create or replace function public.notify_org_holders(
  p_org_id uuid,
  p_permission text,
  p_title text,
  p_body text default null,
  p_type text default 'info'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.notifications (org_id, user_id, title, body, type)
  select distinct p_org_id, m.user_id, p_title, p_body, p_type
  from public.org_members m
  join public.user_roles ur on ur.org_member_id = m.id
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where m.org_id = p_org_id
    and m.status = 'active'
    and p.key = p_permission;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Low-stock alert: fires exactly once per threshold crossing (restock
-- above the reorder level re-arms it), notifying inventory managers.
create or replace function public.notify_low_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
begin
  select p.name, p.sku, p.reorder_level, p.is_active
    into v_product
  from public.products p
  where p.id = NEW.product_id;

  if v_product is null or not v_product.is_active then
    return NEW;
  end if;

  if NEW.quantity_on_hand <= v_product.reorder_level
     and (TG_OP = 'INSERT' or OLD.quantity_on_hand > v_product.reorder_level) then
    perform public.notify_org_holders(
      NEW.org_id,
      'inventory.manage',
      'Low stock: ' || v_product.name,
      v_product.name || ' (' || v_product.sku || ') is down to ' || NEW.quantity_on_hand ||
        ' (reorder level ' || v_product.reorder_level || ').',
      'warning'
    );
  end if;

  return NEW;
end;
$$;

create trigger notify_low_stock
  after insert or update of quantity_on_hand on public.stock_levels
  for each row execute function public.notify_low_stock();

-- Overdue-invoice sweep: called lazily when AR surfaces load (no scheduler
-- inside Postgres), notifies sales.manage once per invoice via the
-- overdue_notified_at stamp. Returns how many were newly flagged.
create or replace function public.check_overdue_invoices(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice record;
  v_count integer := 0;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;

  for v_invoice in
    select id, invoice_number, total, amount_paid, due_date
    from public.sales_invoices
    where org_id = p_org_id
      and status in ('issued', 'partially_paid')
      and due_date is not null
      and due_date < current_date
      and overdue_notified_at is null
  loop
    perform public.notify_org_holders(
      p_org_id,
      'sales.manage',
      'Invoice overdue: ' || v_invoice.invoice_number,
      v_invoice.invoice_number || ' was due ' || v_invoice.due_date::text ||
        ' with ' || (v_invoice.total - v_invoice.amount_paid)::text || ' still outstanding.',
      'warning'
    );
    update public.sales_invoices set overdue_notified_at = now() where id = v_invoice.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Expense submitted -> approvers get told. Trigger keeps it working no
-- matter which client path created the row.
create or replace function public.notify_expense_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'submitted' and (TG_OP = 'INSERT' or OLD.status <> 'submitted') then
    perform public.notify_org_holders(
      NEW.org_id,
      'expenses.approve',
      'Expense awaiting approval',
      NEW.description || ' — $' || NEW.amount::text,
      'info'
    );
  end if;
  return NEW;
end;
$$;

create trigger notify_expense_submitted
  after insert or update of status on public.expenses
  for each row execute function public.notify_expense_submitted();
