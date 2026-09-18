-- Purchase orders: expected delivery date, so late deliveries can be
-- surfaced on the dashboard and the date travels with the PO record.

alter table public.purchase_orders
  add column if not exists expected_date date;

create or replace function public.create_purchase_order(
  p_org_id uuid,
  p_branch_id uuid,
  p_supplier_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_tax_total numeric default 0,
  p_notes text default null,
  p_expected_date date default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  insert into public.purchase_orders (org_id, branch_id, supplier_id, po_number, status, subtotal, tax_total, total, notes, expected_date, created_by)
  values (p_org_id, p_branch_id, p_supplier_id, v_po_number, 'issued', v_subtotal, p_tax_total, v_subtotal + p_tax_total, p_notes, p_expected_date, auth.uid())
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
$function$;
