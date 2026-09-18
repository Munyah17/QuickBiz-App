-- Warehouse transfers: the tables + a bare create_transfer RPC already existed
-- but nothing moved stock. This completes the workflow:
--   pending  → dispatch (stock out of source, transfer_out movements)
--   in_transit → receive (stock into destination, transfer_in movements)
--   pending  → cancel
-- Receiving into a different warehouse keeps a clean stock_movements audit trail.

create or replace function public.create_transfer_with_lines(
  p_org_id uuid,
  p_from_warehouse_id uuid,
  p_to_warehouse_id uuid,
  p_items jsonb default '[]'::jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_transfer_id uuid;
  v_transfer_number text;
  v_item jsonb;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.transfer') then
    raise exception 'insufficient permissions';
  end if;
  if p_from_warehouse_id = p_to_warehouse_id then
    raise exception 'source and destination warehouses must differ';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'a transfer needs at least one line';
  end if;

  v_transfer_number := 'WHT-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.warehouse_transfers
    (org_id, transfer_number, from_warehouse_id, to_warehouse_id, transfer_date, notes, requested_by)
  values (p_org_id, v_transfer_number, p_from_warehouse_id, p_to_warehouse_id, current_date, p_notes, auth.uid())
  returning id into v_transfer_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if (v_item ->> 'quantity')::numeric <= 0 then
      raise exception 'transfer quantities must be greater than zero';
    end if;
    insert into public.warehouse_transfer_lines
      (org_id, transfer_id, product_id, quantity, unit, notes)
    values (
      p_org_id,
      v_transfer_id,
      (v_item ->> 'product_id')::uuid,
      (v_item ->> 'quantity')::numeric,
      coalesce(v_item ->> 'unit', 'ea'),
      v_item ->> 'notes'
    );
  end loop;

  return v_transfer_id;
end;
$function$;

create or replace function public.dispatch_transfer(p_org_id uuid, p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_transfer record;
  v_line record;
  v_on_hand numeric;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.transfer') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_transfer from public.warehouse_transfers
   where id = p_transfer_id and org_id = p_org_id;
  if not found then
    raise exception 'transfer not found';
  end if;
  if v_transfer.status <> 'pending' then
    raise exception 'only pending transfers can be dispatched';
  end if;

  for v_line in
    select * from public.warehouse_transfer_lines where transfer_id = p_transfer_id
  loop
    select quantity_on_hand into v_on_hand from public.stock_levels
     where product_id = v_line.product_id
       and warehouse_id = v_transfer.from_warehouse_id;
    if coalesce(v_on_hand, 0) < v_line.quantity then
      raise exception 'insufficient stock to dispatch % units of a line (have %)', v_line.quantity, coalesce(v_on_hand, 0);
    end if;

    update public.stock_levels
       set quantity_on_hand = quantity_on_hand - v_line.quantity, updated_at = now()
     where product_id = v_line.product_id
       and warehouse_id = v_transfer.from_warehouse_id;

    insert into public.stock_movements
      (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
    values
      (p_org_id, v_line.product_id, v_transfer.from_warehouse_id, -v_line.quantity, 'transfer_out', v_transfer.transfer_number, auth.uid());
  end loop;

  update public.warehouse_transfers
     set status = 'in_transit', updated_at = now()
   where id = p_transfer_id;
end;
$function$;

create or replace function public.receive_transfer(p_org_id uuid, p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_transfer record;
  v_line record;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.transfer') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_transfer from public.warehouse_transfers
   where id = p_transfer_id and org_id = p_org_id;
  if not found then
    raise exception 'transfer not found';
  end if;
  if v_transfer.status <> 'in_transit' then
    raise exception 'only in-transit transfers can be received';
  end if;

  for v_line in
    select * from public.warehouse_transfer_lines where transfer_id = p_transfer_id
  loop
    insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
    values (p_org_id, v_line.product_id, v_transfer.to_warehouse_id, v_line.quantity)
    on conflict (product_id, warehouse_id)
    do update set quantity_on_hand = stock_levels.quantity_on_hand + excluded.quantity_on_hand, updated_at = now();

    insert into public.stock_movements
      (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
    values
      (p_org_id, v_line.product_id, v_transfer.to_warehouse_id, v_line.quantity, 'transfer_in', v_transfer.transfer_number, auth.uid());
  end loop;

  update public.warehouse_transfers
     set status = 'received', approved_by = auth.uid(), updated_at = now()
   where id = p_transfer_id;
end;
$function$;

create or replace function public.cancel_transfer(p_org_id uuid, p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_status text;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'warehousing.transfer') then
    raise exception 'insufficient permissions';
  end if;

  select status into v_status from public.warehouse_transfers
   where id = p_transfer_id and org_id = p_org_id;
  if not found then
    raise exception 'transfer not found';
  end if;
  if v_status <> 'pending' then
    raise exception 'only pending transfers can be cancelled';
  end if;

  update public.warehouse_transfers
     set status = 'cancelled', updated_at = now()
   where id = p_transfer_id;
end;
$function$;
