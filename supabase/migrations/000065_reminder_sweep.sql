-- Time-based reminders (spec: "don't let me forget"). Row-level triggers
-- already notify on events; this adds generate_reminders(), a sweep that
-- creates notifications for things that go stale with time — subscription
-- renewals, overdue invoices, pending approvals, late shipments, low stock.
--
-- Called from the web app on dashboard load (per user, deduped), and can be
-- scheduled for all orgs later via pg_cron without changing the function.

-- Dedupe key so the sweep can run repeatedly without spamming: one row per
-- (user, key). NULLs never conflict, so existing/trigger-written rows are
-- unaffected.
alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_user_dedupe_key
  on public.notifications (user_id, dedupe_key);

create or replace function public.generate_reminders(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_today date := current_date;
  v_created int := 0;
  v_enabled text[];
  r record;
  v_count int;
  v_amount numeric;
begin
  if v_user is null then
    return 0;
  end if;

  -- Caller must be an active member of the org they're sweeping.
  if not exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = v_user and status = 'active'
  ) then
    return 0;
  end if;

  select coalesce(array_agg(module_key), '{}')
    into v_enabled
    from public.org_modules
   where org_id = p_org_id and status = 'enabled';

  -- ---- Finance: subscription renewals (per subscription, per renewal date)
  -- and pending payment requests (daily summary).
  if 'finance' = any(v_enabled) then
    for r in
      select id, name, amount, currency, next_renewal_date
        from public.subscriptions
       where org_id = p_org_id
         and status = 'active'
         and next_renewal_date is not null
         and next_renewal_date <= v_today + 3
    loop
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        case when r.next_renewal_date < v_today
             then 'Subscription overdue: ' || r.name
             else 'Subscription renewing: ' || r.name end,
        r.currency || ' ' || r.amount || ' — renewal date ' || r.next_renewal_date,
        case when r.next_renewal_date < v_today then 'error' else 'warning' end,
        'sub-renewal:' || r.id || ':' || r.next_renewal_date
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end loop;

    select count(*), coalesce(sum(amount), 0)
      into v_count, v_amount
      from public.payment_requests
     where org_id = p_org_id and status = 'pending';
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' payment request' || case when v_count = 1 then '' else 's' end || ' awaiting approval',
        'Total ' || v_amount,
        'warning',
        'pr-pending:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
  end if;

  -- ---- Sales/POS: overdue invoices + pending requisitions + late POs.
  if 'sales' = any(v_enabled) or 'pos' = any(v_enabled) then
    select count(*), coalesce(sum(total - amount_paid), 0)
      into v_count, v_amount
      from public.sales_invoices
     where org_id = p_org_id
       and doc_type = 'invoice'
       and status in ('issued', 'partially_paid')
       and due_date < v_today
       and total - amount_paid > 0;
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' overdue invoice' || case when v_count = 1 then '' else 's' end,
        'Outstanding ' || v_amount,
        'error',
        'ar-overdue:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
  end if;

  if 'sales' = any(v_enabled) then
    select count(*) into v_count
      from public.purchase_requisitions
     where org_id = p_org_id and status = 'pending';
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' purchase requisition' || case when v_count = 1 then '' else 's' end || ' awaiting decision',
        null,
        'warning',
        'req-pending:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;

    select count(*) into v_count
      from public.purchase_orders
     where org_id = p_org_id and status = 'issued' and expected_date < v_today;
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' purchase order' || case when v_count = 1 then '' else 's' end || ' past expected date',
        null,
        'warning',
        'po-late:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
  end if;

  -- ---- Inventory: low stock (daily summary).
  if 'inventory' = any(v_enabled) then
    select count(*) into v_count
      from public.stock_levels sl
      join public.products p on p.id = sl.product_id
     where sl.org_id = p_org_id
       and p.is_active
       and sl.quantity_on_hand <= p.reorder_level;
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' item' || case when v_count = 1 then '' else 's' end || ' at or below reorder level',
        null,
        'warning',
        'stock-low:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
  end if;

  -- ---- Logistics: failed shipments + shipments past ETA.
  if 'logistics' = any(v_enabled) then
    select count(*) into v_count
      from public.shipments
     where org_id = p_org_id and status = 'failed';
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' failed shipment' || case when v_count = 1 then '' else 's' end,
        'Needs resolution',
        'error',
        'ship-failed:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;

    select count(*) into v_count
      from public.shipments
     where org_id = p_org_id
       and status in ('dispatched', 'in_transit')
       and eta is not null
       and eta < v_today;
    if v_count > 0 then
      insert into public.notifications (org_id, user_id, title, body, type, dedupe_key)
      values (
        p_org_id, v_user,
        v_count || ' shipment' || case when v_count = 1 then '' else 's' end || ' past ETA',
        'Still in transit',
        'warning',
        'ship-late:' || v_today
      )
      on conflict (user_id, dedupe_key) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
  end if;

  return v_created;
end;
$function$;
