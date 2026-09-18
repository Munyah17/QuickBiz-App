-- Edit a draft invoice (or quotation): replaces the line items and updates
-- header fields. Issued documents stay immutable — that's what credit
-- notes are for. Works for quotes too (they're drafts under the hood).

create or replace function public.update_draft_invoice(
  p_org_id uuid,
  p_invoice_id uuid,
  p_customer_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_tax_total numeric default 0,
  p_notes text default null,
  p_due_date date default null,
  p_discount_total numeric default 0,
  p_discount_reason text default null
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

  delete from public.sales_invoice_items where invoice_id = p_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
    v_subtotal := v_subtotal + v_line_total;
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;

    insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
    values (p_invoice_id, v_product_id, v_item ->> 'description', (v_item ->> 'quantity')::numeric, (v_item ->> 'unit_price')::numeric, v_line_total);
  end loop;

  update public.sales_invoices
  set customer_id = p_customer_id,
      subtotal = v_subtotal,
      tax_total = p_tax_total,
      discount_total = p_discount_total,
      discount_reason = nullif(p_discount_reason, ''),
      total = v_subtotal + p_tax_total - p_discount_total,
      notes = p_notes,
      due_date = p_due_date
  where id = p_invoice_id;
end;
$function$;
