-- ERP depth pass: new sales document types (debit notes, BOQs), proof-of-
-- payment on payments, subscriptions (incoming + outgoing), payment
-- requests/approvals, purchase requisitions, internal buyer on POs, and
-- shipment route/tracking depth.
-- All new RPC params default so existing callers keep working.

-- ---------------------------------------------------------------------------
-- 1. Sales document types: debit_note + boq
--    debit_note = invoice-like (AR, credit limit, payments) but no stock
--    movement — it's a financial adjustment, not a goods movement.
--    boq        = quote-like (always draft, no stock/AR until converted).
-- ---------------------------------------------------------------------------
alter table public.sales_invoices
  drop constraint if exists sales_invoices_doc_type_check;

alter table public.sales_invoices
  add constraint sales_invoices_doc_type_check
  check (doc_type in ('invoice', 'quote', 'debit_note', 'boq'));

insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
select o.id, 'sales_debit_note', 'DBN-', 1 from public.organizations o
on conflict (org_id, entity_type) do nothing;

insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
select o.id, 'sales_boq', 'BOQ-', 1 from public.organizations o
on conflict (org_id, entity_type) do nothing;

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
  p_status text default 'issued',
  p_doc_type text default 'invoice',
  p_invoice_date date default null,
  p_reference text default null,
  p_salesperson text default null,
  p_payment_terms text default null,
  p_shipping_total numeric default 0,
  p_billing_address text default null,
  p_delivery_address text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  if p_doc_type not in ('invoice', 'quote', 'debit_note', 'boq') then
    raise exception 'invalid document type';
  end if;

  -- Quotes and BOQs are always drafts — nothing is committed until conversion.
  if p_doc_type in ('quote', 'boq') then
    p_status := 'draft';
  end if;

  if p_discount_total < 0 then
    raise exception 'discount cannot be negative';
  end if;
  if p_shipping_total < 0 then
    raise exception 'shipping cannot be negative';
  end if;

  -- Credit-limit enforcement on issued financial docs (invoices + debit
  -- notes). Drafts, quotes and BOQs don't commit the customer yet.
  if p_status = 'issued' and p_doc_type in ('invoice', 'debit_note') and p_customer_id is not null then
    select credit_limit into v_customer from public.customers where id = p_customer_id;
    if v_customer.credit_limit is not null then
      declare
        v_open_balance numeric;
        v_new_total numeric;
      begin
        select coalesce(sum(total - amount_paid), 0) into v_open_balance
        from public.sales_invoices
        where customer_id = p_customer_id and doc_type in ('invoice', 'debit_note') and status in ('issued', 'partially_paid');
        v_new_total := 0;
        for v_item in select * from jsonb_array_elements(p_items) loop
          v_new_total := v_new_total
            + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric
            - coalesce((v_item ->> 'discount')::numeric, 0);
        end loop;
        v_new_total := v_new_total + p_tax_total + p_shipping_total - p_discount_total;
        if v_open_balance + v_new_total > v_customer.credit_limit then
          raise exception 'invoice would exceed the customer credit limit (open balance % + % > limit %)',
            v_open_balance, v_new_total, v_customer.credit_limit;
        end if;
      end;
    end if;
  end if;

  if p_doc_type = 'quote' then
    insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
    values (p_org_id, 'sales_quote', 'QUO-', 1)
    on conflict (org_id, entity_type) do nothing;
  elsif p_doc_type = 'debit_note' then
    insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
    values (p_org_id, 'sales_debit_note', 'DBN-', 1)
    on conflict (org_id, entity_type) do nothing;
  elsif p_doc_type = 'boq' then
    insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
    values (p_org_id, 'sales_boq', 'BOQ-', 1)
    on conflict (org_id, entity_type) do nothing;
  end if;

  v_invoice_number := public.next_number(
    p_org_id,
    case p_doc_type
      when 'quote' then 'sales_quote'
      when 'debit_note' then 'sales_debit_note'
      when 'boq' then 'sales_boq'
      else 'sales_invoice'
    end
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal
      + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric
      - coalesce((v_item ->> 'discount')::numeric, 0);
  end loop;

  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, doc_type, subtotal, tax_total,
     discount_total, discount_reason, shipping_total, total, notes, due_date, invoice_date,
     reference, salesperson, payment_terms, billing_address, delivery_address, issued_at, created_by)
  values
    (p_org_id, p_branch_id, p_customer_id, v_invoice_number, p_status, p_doc_type, v_subtotal, p_tax_total,
     p_discount_total, nullif(p_discount_reason, ''), p_shipping_total,
     v_subtotal + p_tax_total + p_shipping_total - p_discount_total,
     p_notes, p_due_date, coalesce(p_invoice_date, current_date),
     nullif(p_reference, ''), nullif(p_salesperson, ''), nullif(p_payment_terms, ''),
     nullif(p_billing_address, ''), nullif(p_delivery_address, ''),
     case when p_status = 'issued' then now() else null end, auth.uid())
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric
      - coalesce((v_item ->> 'discount')::numeric, 0);
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := (v_item ->> 'quantity')::numeric;

    insert into public.sales_invoice_items
      (invoice_id, product_id, description, sku, unit, quantity, unit_price, discount, tax_rate, line_total)
    values
      (v_invoice_id, v_product_id, v_item ->> 'description', nullif(v_item ->> 'sku', ''),
       nullif(v_item ->> 'unit', ''), v_quantity, (v_item ->> 'unit_price')::numeric,
       coalesce((v_item ->> 'discount')::numeric, 0), (v_item ->> 'tax_rate')::numeric, v_line_total);

    -- Stock only moves for issued invoices — never drafts, quotes, BOQs, or
    -- debit notes (a debit note adjusts money owed, not goods shipped).
    if p_status = 'issued' and p_doc_type = 'invoice' and v_product_id is not null and p_warehouse_id is not null then
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
$function$;

-- issue_invoice: allow debit notes through the same draft → issued flow.
-- Stock only moves for real invoices; debit notes are financial adjustments.
create or replace function public.issue_invoice(p_org_id uuid, p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  if v_invoice.doc_type not in ('invoice', 'debit_note') then
    raise exception 'only invoices and debit notes can be issued — convert quotations first';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'only draft documents can be issued';
  end if;

  if v_invoice.customer_id is not null then
    declare
      v_credit_limit numeric;
    begin
      select credit_limit into v_credit_limit from public.customers where id = v_invoice.customer_id;
      if v_credit_limit is not null then
        select coalesce(sum(total - amount_paid), 0) into v_open_balance
        from public.sales_invoices
        where customer_id = v_invoice.customer_id and doc_type in ('invoice', 'debit_note') and status in ('issued', 'partially_paid');
        if v_open_balance + v_invoice.total > v_credit_limit then
          raise exception 'issuing this document would exceed the customer credit limit';
        end if;
      end if;
    end;
  end if;

  -- Stock deduction only for real invoices.
  if v_invoice.doc_type = 'invoice' then
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
  end if;

  update public.sales_invoices
  set status = 'issued', issued_at = now()
  where id = p_invoice_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Proof of payment on both payment ledgers.
-- ---------------------------------------------------------------------------
alter table public.sales_payments add column if not exists proof_url text;
alter table public.purchase_payments add column if not exists proof_url text;

create or replace function public.record_sales_payment(
  p_org_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_proof_url text default null
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

  insert into public.sales_payments (org_id, invoice_id, amount, method, reference, proof_url, recorded_by)
  values (p_org_id, p_invoice_id, p_amount, p_method, p_reference, nullif(p_proof_url, ''), auth.uid());

  update public.sales_invoices
  set amount_paid = amount_paid + p_amount,
      status = case when amount_paid + p_amount >= total then 'paid' else status end
  where id = p_invoice_id and org_id = p_org_id;
end;
$$;

create or replace function public.record_purchase_payment(
  p_org_id uuid,
  p_po_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_proof_url text default null
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

  insert into public.purchase_payments (org_id, po_id, amount, method, reference, proof_url, recorded_by)
  values (p_org_id, p_po_id, p_amount, p_method, p_reference, nullif(p_proof_url, ''), auth.uid());

  update public.purchase_orders set amount_paid = amount_paid + p_amount
  where id = p_po_id and org_id = p_org_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Subscriptions — incoming (clients subscribed to us) and outgoing (us
--    subscribed to external services). Renewal tracking is the core value:
--    next_renewal_date drives reminders on the dashboard.
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  direction text not null check (direction in ('incoming', 'outgoing')),
  name text not null,
  counterparty text not null, -- customer name (incoming) or vendor name (outgoing)
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'yearly', 'once')),
  start_date date not null default current_date,
  next_renewal_date date,
  auto_renew boolean not null default true,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_org_id_idx on public.subscriptions (org_id);
create index if not exists subscriptions_renewal_idx on public.subscriptions (org_id, next_renewal_date) where status = 'active';

alter table public.subscriptions enable row level security;

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create policy subscriptions_select on public.subscriptions
  for select using (org_id in (select public.user_org_ids()));

create policy subscriptions_write on public.subscriptions
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'));

create trigger audit_subscriptions
  after insert or update or delete on public.subscriptions
  for each row execute function public.audit_trigger_with_module('finance');

-- ---------------------------------------------------------------------------
-- 4. Payment requests + approvals. Anyone can request; expenses.approve
--    approves; finance.manage marks paid.
-- ---------------------------------------------------------------------------
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  request_number text not null,
  payee text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  reason text not null,
  category text,
  needed_by date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  requested_by uuid references public.profiles(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  paid_at timestamptz,
  po_id uuid references public.purchase_orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, request_number)
);

create index if not exists payment_requests_org_id_idx on public.payment_requests (org_id);

alter table public.payment_requests enable row level security;

create trigger set_payment_requests_updated_at
  before update on public.payment_requests
  for each row execute function public.set_updated_at();

-- Any org member can read and create requests (it's how staff ask for money);
-- approval is enforced in the decide_payment_request RPC.
create policy payment_requests_select on public.payment_requests
  for select using (org_id in (select public.user_org_ids()));

create policy payment_requests_insert on public.payment_requests
  for insert with check (org_id in (select public.user_org_ids()));

create policy payment_requests_update on public.payment_requests
  for update using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'finance.manage'));

create trigger audit_payment_requests
  after insert or update or delete on public.payment_requests
  for each row execute function public.audit_trigger_with_module('finance');

create or replace function public.create_payment_request(
  p_org_id uuid,
  p_branch_id uuid,
  p_payee text,
  p_amount numeric,
  p_reason text,
  p_category text default null,
  p_needed_by date default null,
  p_po_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
  values (p_org_id, 'payment_request', 'PR-', 1)
  on conflict (org_id, entity_type) do nothing;
  v_number := public.next_number(p_org_id, 'payment_request');

  insert into public.payment_requests
    (org_id, branch_id, request_number, payee, amount, reason, category, needed_by, po_id, requested_by)
  values
    (p_org_id, p_branch_id, v_number, p_payee, p_amount, p_reason, nullif(p_category, ''), p_needed_by, p_po_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.decide_payment_request(
  p_org_id uuid,
  p_request_id uuid,
  p_decision text, -- 'approved' | 'rejected'
  p_note text default null
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
  if not public.has_permission(p_org_id, 'expenses.approve') then
    raise exception 'insufficient permissions to approve payment requests';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  update public.payment_requests
  set status = p_decision, decided_by = auth.uid(), decided_at = now(), decision_note = nullif(p_note, '')
  where id = p_request_id and org_id = p_org_id and status = 'pending';

  if not found then
    raise exception 'payment request not found or already decided';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Purchase requisitions — internal ask → approve → convert to PO.
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_requisitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  requisition_number text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'converted', 'cancelled')),
  needed_by date,
  justification text,
  requested_by uuid references public.profiles(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  po_id uuid references public.purchase_orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, requisition_number)
);

create index if not exists purchase_requisitions_org_id_idx on public.purchase_requisitions (org_id);

alter table public.purchase_requisitions enable row level security;

create trigger set_purchase_requisitions_updated_at
  before update on public.purchase_requisitions
  for each row execute function public.set_updated_at();

create policy purchase_requisitions_select on public.purchase_requisitions
  for select using (org_id in (select public.user_org_ids()));

create policy purchase_requisitions_insert on public.purchase_requisitions
  for insert with check (org_id in (select public.user_org_ids()));

create policy purchase_requisitions_update on public.purchase_requisitions
  for update using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'purchasing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'purchasing.manage'));

create trigger audit_purchase_requisitions
  after insert or update or delete on public.purchase_requisitions
  for each row execute function public.audit_trigger_with_module('purchasing');

create table if not exists public.purchase_requisition_items (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references public.purchase_requisitions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  estimated_cost numeric(12, 2) not null default 0
);

create index if not exists purchase_requisition_items_req_idx on public.purchase_requisition_items (requisition_id);

alter table public.purchase_requisition_items enable row level security;

create policy purchase_requisition_items_select on public.purchase_requisition_items
  for select using (
    requisition_id in (select id from public.purchase_requisitions where org_id in (select public.user_org_ids()))
  );

create policy purchase_requisition_items_insert on public.purchase_requisition_items
  for insert with check (
    requisition_id in (select id from public.purchase_requisitions where org_id in (select public.user_org_ids()))
  );

create or replace function public.create_purchase_requisition(
  p_org_id uuid,
  p_branch_id uuid,
  p_items jsonb,
  p_needed_by date default null,
  p_justification text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
  v_item jsonb;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'a requisition needs at least one line item';
  end if;

  insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
  values (p_org_id, 'purchase_requisition', 'REQ-', 1)
  on conflict (org_id, entity_type) do nothing;
  v_number := public.next_number(p_org_id, 'purchase_requisition');

  insert into public.purchase_requisitions
    (org_id, branch_id, requisition_number, needed_by, justification, requested_by)
  values
    (p_org_id, p_branch_id, v_number, p_needed_by, nullif(p_justification, ''), auth.uid())
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.purchase_requisition_items (requisition_id, product_id, description, quantity, estimated_cost)
    values (
      v_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      v_item ->> 'description',
      (v_item ->> 'quantity')::numeric,
      coalesce((v_item ->> 'estimated_cost')::numeric, 0)
    );
  end loop;

  return v_id;
end;
$$;

create or replace function public.decide_purchase_requisition(
  p_org_id uuid,
  p_requisition_id uuid,
  p_decision text -- 'approved' | 'rejected'
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
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  update public.purchase_requisitions
  set status = p_decision, decided_by = auth.uid(), decided_at = now()
  where id = p_requisition_id and org_id = p_org_id and status = 'pending';

  if not found then
    raise exception 'requisition not found or already decided';
  end if;
end;
$$;

-- Internal buyer on POs (who in our org owns this purchase).
alter table public.purchase_orders add column if not exists buyer_name text;

-- ---------------------------------------------------------------------------
-- 6. Shipment depth: route planning + tracking event timeline.
-- ---------------------------------------------------------------------------
alter table public.shipments
  add column if not exists origin_address text,
  add column if not exists route_description text,
  add column if not exists eta timestamptz,
  add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent'));

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  location text,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists shipment_events_shipment_idx on public.shipment_events (shipment_id, occurred_at);

alter table public.shipment_events enable row level security;

create policy shipment_events_select on public.shipment_events
  for select using (
    shipment_id in (select id from public.shipments where org_id in (select public.user_org_ids()))
  );

create policy shipment_events_insert on public.shipment_events
  for insert with check (
    shipment_id in (select id from public.shipments where org_id in (select public.user_org_ids()))
  );
