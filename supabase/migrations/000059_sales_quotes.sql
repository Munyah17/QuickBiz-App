-- Sales quotations — a quote is a sales_invoices row with doc_type='quote'
-- and status='draft'. It never touches stock, AR or credit until converted,
-- which flips doc_type and runs the normal issue flow.

alter table public.sales_invoices
  add column if not exists doc_type text not null default 'invoice';

alter table public.sales_invoices
  drop constraint if exists sales_invoices_doc_type_check;

alter table public.sales_invoices
  add constraint sales_invoices_doc_type_check check (doc_type in ('invoice', 'quote'));

create index if not exists sales_invoices_org_doctype_idx
  on public.sales_invoices (org_id, doc_type);

-- Quotes get their own QUO- numbering sequence (next_number lazily creates
-- the row for orgs that don't have it yet — this seeds a sane prefix for
-- orgs that already exist).
insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
select id, 'sales_quote', 'QUO-', 1 from public.organizations
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
  p_doc_type text default 'invoice'
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
    v_subtotal := v_subtotal + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
  end loop;

  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, doc_type, subtotal, tax_total,
     discount_total, discount_reason, total, notes, due_date, issued_at, created_by)
  values
    (p_org_id, p_branch_id, p_customer_id, v_invoice_number, p_status, p_doc_type, v_subtotal, p_tax_total,
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
  if v_invoice.doc_type <> 'invoice' then
    raise exception 'only invoices can be issued — convert quotations first';
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
        where customer_id = v_invoice.customer_id and doc_type = 'invoice' and status in ('issued', 'partially_paid');
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
$function$;

-- Convert a quotation into a live invoice: flips the doc type and runs the
-- standard issue flow (stock deduction, credit-limit check, issued_at).
create or replace function public.convert_quote_to_invoice(p_org_id uuid, p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_quote record;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'sales.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_quote from public.sales_invoices
  where id = p_quote_id and org_id = p_org_id and doc_type = 'quote';
  if not found then
    raise exception 'quotation not found';
  end if;

  if v_quote.status = 'cancelled' then
    raise exception 'a cancelled quotation cannot be converted';
  end if;

  update public.sales_invoices
    set doc_type = 'invoice'
    where id = p_quote_id;

  -- issue_invoice does the stock + credit work and stamps issued_at.
  perform public.issue_invoice(p_org_id, p_quote_id);
end;
$function$;
