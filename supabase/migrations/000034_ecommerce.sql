-- Ecommerce module: an online catalog (which existing Products are
-- published, at what online price) + order tracking for sales made through
-- the org's own online channels (WhatsApp, Instagram, marketplace listings).
-- QuickBiz does not host a public storefront, cart, or payment checkout yet
-- (spec's own "no fake functionality" rule, and payment collection is
-- already deferred platform-wide) — this is the honest, real-data slice:
-- staff record what actually sold online, reusing the canonical Product and
-- Customer entities rather than duplicating them.

insert into public.permissions (key, label, category) values
  ('ecommerce.manage', 'Manage the online catalog and online orders', 'sales')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'ecommerce.manage'
on conflict do nothing;

create table if not exists public.online_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null,
  online_price numeric(12, 2),
  description_override text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, product_id),
  unique (org_id, slug)
);

create index if not exists online_products_org_id_idx on public.online_products (org_id);

alter table public.online_products enable row level security;

create trigger set_online_products_updated_at
  before update on public.online_products
  for each row execute function public.set_updated_at();

create policy online_products_select on public.online_products
  for select using (org_id in (select public.user_org_ids()));

create policy online_products_write on public.online_products
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'ecommerce.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'ecommerce.manage'));

create trigger audit_online_products
  after insert or update or delete on public.online_products
  for each row execute function public.audit_trigger_with_module('ecommerce');

create table if not exists public.online_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  guest_name text,
  guest_phone text,
  order_number text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'fulfilled', 'cancelled')),
  delivery_method text not null default 'pickup' check (delivery_method in ('pickup', 'delivery')),
  delivery_status text not null default 'not_shipped' check (delivery_status in ('not_shipped', 'shipped', 'delivered')),
  delivery_address text,
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, order_number),
  constraint online_orders_customer_or_guest check (customer_id is not null or guest_name is not null)
);

create index if not exists online_orders_org_id_idx on public.online_orders (org_id);

alter table public.online_orders enable row level security;

create trigger set_online_orders_updated_at
  before update on public.online_orders
  for each row execute function public.set_updated_at();

create policy online_orders_select on public.online_orders
  for select using (org_id in (select public.user_org_ids()));

create policy online_orders_write on public.online_orders
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'ecommerce.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'ecommerce.manage'));

create trigger audit_online_orders
  after insert or update or delete on public.online_orders
  for each row execute function public.audit_trigger_with_module('ecommerce');

create table if not exists public.online_order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null references public.online_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists online_order_items_org_id_idx on public.online_order_items (org_id);
create index if not exists online_order_items_order_id_idx on public.online_order_items (order_id);

alter table public.online_order_items enable row level security;

create policy online_order_items_select on public.online_order_items
  for select using (org_id in (select public.user_org_ids()));

create policy online_order_items_write on public.online_order_items
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'ecommerce.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'ecommerce.manage'));

-- Mirrors create_sales_invoice's pattern exactly (same jsonb line-item shape,
-- same inline stock deduction when a warehouse is given) — an online order
-- is a sale through a different channel, not a separate accounting concept.
create or replace function public.create_online_order(
  p_org_id uuid,
  p_branch_id uuid,
  p_customer_id uuid default null,
  p_guest_name text default null,
  p_guest_phone text default null,
  p_warehouse_id uuid default null,
  p_delivery_method text default 'pickup',
  p_delivery_address text default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_line_total numeric;
  v_product_id uuid;
  v_quantity numeric;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'ecommerce.manage') then
    raise exception 'insufficient permissions';
  end if;
  if p_customer_id is null and p_guest_name is null then
    raise exception 'an order needs either a customer or a guest name';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'an order needs at least one line item';
  end if;

  v_order_number := public.next_number(p_org_id, 'online_order');

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal + (v_item ->> 'quantity')::numeric * (v_item ->> 'unit_price')::numeric;
  end loop;

  insert into public.online_orders
    (org_id, branch_id, customer_id, guest_name, guest_phone, order_number, subtotal, total, delivery_method, delivery_address, notes, created_by)
  values
    (p_org_id, p_branch_id, p_customer_id, p_guest_name, p_guest_phone, v_order_number, v_subtotal, v_subtotal, p_delivery_method, p_delivery_address, p_notes, auth.uid())
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::numeric;
    v_line_total := v_quantity * (v_item ->> 'unit_price')::numeric;

    insert into public.online_order_items (org_id, order_id, product_id, quantity, unit_price, line_total)
    values (p_org_id, v_order_id, v_product_id, v_quantity, (v_item ->> 'unit_price')::numeric, v_line_total);

    if p_warehouse_id is not null then
      insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
      values (p_org_id, v_product_id, p_warehouse_id, -v_quantity)
      on conflict (product_id, warehouse_id)
      do update set quantity_on_hand = stock_levels.quantity_on_hand - v_quantity, updated_at = now();

      insert into public.stock_movements (org_id, product_id, warehouse_id, quantity_delta, reason, reference, created_by)
      values (p_org_id, v_product_id, p_warehouse_id, -v_quantity, 'sale', v_order_number, auth.uid());
    end if;
  end loop;

  return v_order_id;
end;
$$;
