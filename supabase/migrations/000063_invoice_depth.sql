-- Invoice depth: professional header fields (PO/reference, salesperson,
-- payment terms, shipping, address snapshots, invoice date) and richer
-- line items (SKU, unit, per-line discount, per-line tax rate).
-- All new RPC params default so existing callers (POS, API) keep working.

alter table public.sales_invoices
  add column if not exists invoice_date date,
  add column if not exists reference text,
  add column if not exists salesperson text,
  add column if not exists payment_terms text,
  add column if not exists shipping_total numeric(12, 2) not null default 0,
  add column if not exists billing_address text,
  add column if not exists delivery_address text;

-- Backfill invoice_date from created_at for existing rows.
update public.sales_invoices set invoice_date = created_at::date where invoice_date is null;
alter table public.sales_invoices alter column invoice_date set default current_date;
alter table public.sales_invoices alter column invoice_date set not null;

alter table public.sales_invoice_items
  add column if not exists sku text,
  add column if not exists unit text,
  add column if not exists discount numeric(12, 2) not null default 0,
  add column if not exists tax_rate numeric(5, 2);

-- ---------------------------------------------------------------------------
-- create_sales_invoice — extended header + per-line fields.
-- line_total = qty * price - line discount; subtotal is the sum of net lines.
-- total = subtotal + tax + shipping - header discount.
-- ---------------------------------------------------------------------------
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
  if p_doc_type not in ('invoice', 'quote') then
    raise exception 'invalid document type';
  end if;

  -- Quotes are always drafts — nothing is committed until conversion.
  if p_doc_type = 'quote' then
    p_status := 'draft';
  end if;

  if p_discount_total < 0 then
    raise exception 'discount cannot be negative';
  end if;
  if p_shipping_total < 0 then
    raise exception 'shipping cannot be negative';
  end if;

  -- Credit-limit enforcement on issued invoices (drafts and quotes don't
  -- commit the customer yet — it re-fires on issue_invoice()).
  if p_status = 'issued' and p_doc_type = 'invoice' and p_customer_id is not null then
    select credit_limit into v_customer from public.customers where id = p_customer_id;
    if v_customer.credit_limit is not null then
      declare
        v_open_balance numeric;
        v_new_total numeric;
      begin
        select coalesce(sum(total - amount_paid), 0) into v_open_balance
        from public.sales_invoices
        where customer_id = p_customer_id and doc_type = 'invoice' and status in ('issued', 'partially_paid');
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
  end if;

  v_invoice_number := public.next_number(
    p_org_id,
    case when p_doc_type = 'quote' then 'sales_quote' else 'sales_invoice' end
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

    -- Stock only moves once the invoice is real (issued), never for drafts or quotes.
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

-- ---------------------------------------------------------------------------
-- update_draft_invoice — same extended fields for draft edits.
-- ---------------------------------------------------------------------------
create or replace function public.update_draft_invoice(
  p_org_id uuid,
  p_invoice_id uuid,
  p_customer_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_tax_total numeric default 0,
  p_notes text default null,
  p_due_date date default null,
  p_discount_total numeric default 0,
  p_discount_reason text default null,
  p_invoice_date date default null,
  p_reference text default null,
  p_salesperson text default null,
  p_payment_terms text default null,
  p_shipping_total numeric default 0,
  p_billing_address text default null,
  p_delivery_address text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_invoice record;
  v_item jsonb;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_product_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_invoice from public.sales_invoices
    where id = p_invoice_id and org_id = p_org_id
    for update;
  if not found then
    raise exception 'invoice not found';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'only draft documents can be edited';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'an invoice needs at least one line item';
  end if;
  if p_discount_total < 0 then
    raise exception 'discount cannot be negative';
  end if;
  if p_shipping_total < 0 then
    raise exception 'shipping cannot be negative';
  end if;

  delete from public.sales_invoice_items where invoice_id = p_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric
      - coalesce((v_item ->> 'discount')::numeric, 0);
    v_subtotal := v_subtotal + v_line_total;
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;

    insert into public.sales_invoice_items
      (invoice_id, product_id, description, sku, unit, quantity, unit_price, discount, tax_rate, line_total)
    values
      (p_invoice_id, v_product_id, v_item ->> 'description', nullif(v_item ->> 'sku', ''),
       nullif(v_item ->> 'unit', ''), (v_item ->> 'quantity')::numeric, (v_item ->> 'unit_price')::numeric,
       coalesce((v_item ->> 'discount')::numeric, 0), (v_item ->> 'tax_rate')::numeric, v_line_total);
  end loop;

  update public.sales_invoices
  set customer_id = p_customer_id,
      subtotal = v_subtotal,
      tax_total = p_tax_total,
      discount_total = p_discount_total,
      discount_reason = nullif(p_discount_reason, ''),
      shipping_total = p_shipping_total,
      total = v_subtotal + p_tax_total + p_shipping_total - p_discount_total,
      notes = p_notes,
      due_date = p_due_date,
      invoice_date = coalesce(p_invoice_date, invoice_date),
      reference = nullif(p_reference, ''),
      salesperson = nullif(p_salesperson, ''),
      payment_terms = nullif(p_payment_terms, ''),
      billing_address = nullif(p_billing_address, ''),
      delivery_address = nullif(p_delivery_address, '')
  where id = p_invoice_id;
end;
$function$;
