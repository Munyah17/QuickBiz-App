-- Local/demo data only. Never run against staging or production (see spec §4/§40).
-- Reproducible via `supabase db reset`.

-- Demo owner account: demo@quickbiz.local / Demo1234!
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'demo@quickbiz.local',
  crypt('Demo1234!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo Owner"}'::jsonb,
  false, '', '', '', ''
);

insert into auth.identities (
  user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'a0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'demo@quickbiz.local'),
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

-- Impersonate the demo user so create_organization()/auth.uid() resolve correctly,
-- exercising the exact same RPC path a real signup would use. SET LOCAL only
-- takes effect inside an explicit transaction, hence the begin/commit.
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);
set local role authenticated;

select public.create_organization('Demo Company (Pvt) Ltd', 'Head Office');
commit;

-- Flesh out the demo org: a second branch and a couple of departments, so the
-- Branches/Company pages aren't empty on first login.
do $$
declare
  v_org_id uuid;
  v_head_office_id uuid;
  v_branch2_id uuid;
begin
  select id into v_org_id from public.organizations where name = 'Demo Company (Pvt) Ltd';
  select id into v_head_office_id from public.branches where org_id = v_org_id and type = 'head_office';

  insert into public.branches (org_id, name, code, type, address, is_active)
  values (
    v_org_id, 'Bulawayo Branch', 'BYO-01', 'branch',
    jsonb_build_object('city', 'Bulawayo', 'country', 'Zimbabwe'),
    true
  )
  returning id into v_branch2_id;

  update public.branches
  set address = jsonb_build_object('city', 'Harare', 'country', 'Zimbabwe', 'street', '1 Samora Machel Ave')
  where id = v_head_office_id;

  insert into public.departments (org_id, branch_id, name) values
    (v_org_id, v_head_office_id, 'Finance'),
    (v_org_id, v_head_office_id, 'Operations'),
    (v_org_id, v_branch2_id, 'Sales');

  update public.organizations
  set legal_name = 'Demo Company (Private) Limited', currency = 'USD'
  where id = v_org_id;

  insert into public.org_settings (org_id, key, value) values
    (v_org_id, 'tax.default_rate', '"15%"'::jsonb),
    (v_org_id, 'contact.phone', '"+263 77 123 4567"'::jsonb);
end $$;

-- Internal QuickBiz staff account (Super Admin) for the backoffice:
-- staff@quickbiz.local / Staff1234! — deliberately NOT a member of any
-- tenant org, per the platform_staff/tenant-roles separation above.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'staff@quickbiz.local',
  crypt('Staff1234!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"QuickBiz Staff"}'::jsonb,
  false, '', '', '', ''
);

insert into auth.identities (
  user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'b0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000001', 'email', 'staff@quickbiz.local'),
  'email',
  'b0000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

insert into public.platform_staff (user_id, role_key, status)
values ('b0000000-0000-0000-0000-000000000001', 'super_admin', 'active');

-- ============================================================
-- Demo business data — so every module screen is populated on
-- first login. Idempotent: skips entirely if products exist.
-- Runs as postgres (bypasses RLS), matching the org creation above.
-- ============================================================
do $$
declare
  v_org uuid;
  v_user uuid := 'a0000000-0000-0000-0000-000000000001';
  v_ho uuid; v_byo uuid;
  v_wh_ho uuid; v_wh_byo uuid;
  v_reg uuid;
  v_session_closed uuid; v_session_open uuid;
  -- product ids
  v_p record;
  -- customer ids
  v_c1 uuid; v_c2 uuid; v_c3 uuid; v_c4 uuid; v_c5 uuid;
  -- supplier ids
  v_s1 uuid; v_s2 uuid; v_s3 uuid; v_s4 uuid;
  -- accounts
  v_acc record;
  v_inv uuid;
  v_po uuid;
begin
  select id into v_org from public.organizations where name = 'Demo Company (Pvt) Ltd';
  if v_org is null then return; end if;
  if exists (select 1 from public.products where org_id = v_org) then return; end if;

  select id into v_ho from public.branches where org_id = v_org and type = 'head_office';
  select id into v_byo from public.branches where org_id = v_org and type <> 'head_office' order by name limit 1;
  select id into v_wh_ho from public.warehouses where org_id = v_org and branch_id = v_ho limit 1;
  select id into v_wh_byo from public.warehouses where org_id = v_org and branch_id = v_byo limit 1;
  select id into v_reg from public.pos_registers where org_id = v_org and branch_id = v_ho limit 1;

  -- Modules — the implemented set, so the sidebar lights up end-to-end.
  insert into public.org_modules (org_id, module_key, status, enabled_at)
  select v_org, m, 'enabled', now()
  from unnest(array[
    'inventory','sales','pos','purchasing','finance','hr','crm','projects',
    'assets','service_management','fleet','documents','reporting','marketing',
    'manufacturing','ecommerce','local_services','logistics','custom_code',
    'warehousing','stock_take','tax_compliance','tender_bidding','disciplinary',
    'sheq','social_media','email','iban','risk_insurance','payroll'
  ]) as m
  on conflict (org_id, module_key) do update set status = 'enabled', enabled_at = now();

  -- Chart of accounts (mirrors seed_default_accounts).
  insert into public.accounts (org_id, code, name, type) values
    (v_org,'1000','Cash','asset'), (v_org,'1010','Bank Account','asset'),
    (v_org,'1100','Accounts Receivable','asset'), (v_org,'1200','Inventory','asset'),
    (v_org,'2000','Accounts Payable','liability'), (v_org,'3000','Owner''s Equity','equity'),
    (v_org,'4000','Sales Revenue','income'), (v_org,'5000','Cost of Goods Sold','expense'),
    (v_org,'5100','Rent','expense'), (v_org,'5200','Salaries & Wages','expense'),
    (v_org,'5300','Utilities','expense'), (v_org,'5400','Office Supplies','expense'),
    (v_org,'5500','Marketing','expense'), (v_org,'5600','Transport & Travel','expense'),
    (v_org,'5700','Bank Charges','expense'), (v_org,'5900','Other Expenses','expense')
  on conflict do nothing;

  -- Categories + products.
  insert into public.product_categories (org_id, name) values
    (v_org,'Beverages'), (v_org,'Groceries'), (v_org,'Electronics'), (v_org,'Hardware');

  insert into public.products (org_id, category_id, sku, name, description, unit_of_measure, cost_price, selling_price, reorder_level, barcode)
  select v_org, c.id, p.sku, p.name, p.description, p.uom, p.cost, p.price, p.reorder, p.barcode
  from (values
    ('BEV-SUG-2K','Beverages','Cane Sugar 2kg','Refined cane sugar, 2kg bag','ea',2.40,3.20,15,'6001248000011'),
    ('BEV-MAZ-2L','Beverages','Mazowe Orange Juice 2L','Orange crush, 2 litre bottle','ea',1.80,2.75,20,'6001248000028'),
    ('BEV-TAN-100','Beverages','Tanganda Tea Bags 100s','Box of 100 tagged tea bags','ea',3.10,4.50,12,'6001248000035'),
    ('GRO-MM-10K','Groceries','Mealie Meal 10kg','Roller-milled white maize meal, 10kg','ea',6.50,8.95,25,'6001248000042'),
    ('GRO-OIL-2L','Groceries','Cooking Oil 2L','Pure sunflower cooking oil, 2L','ea',3.80,5.25,20,'6001248000059'),
    ('GRO-BREAD','Groceries','White Bread Loaf','Standard white loaf','ea',0.85,1.25,30,'6001248000066'),
    ('ELE-SOL-100','Electronics','Solar Panel 100W','Monocrystalline 100W panel','ea',45.00,69.99,5,'6001248000073'),
    ('ELE-BAT-100','Electronics','Lithium Battery 100Ah','12V LiFePO4 deep-cycle battery','ea',180.00,289.00,3,'6001248000080'),
    ('ELE-LED-9W','Electronics','LED Bulb 9W','Warm white, B22 bayonet','ea',1.20,2.50,40,'6001248000097'),
    ('HW-CEM-50','Hardware','Cement 50kg','Portland cement, 50kg bag','ea',8.90,11.50,20,'6001248000103')
  ) as p(sku, cat, name, description, uom, cost, price, reorder, barcode)
  join public.product_categories c on c.org_id = v_org and c.name = p.cat;

  -- Stock levels — a few deliberately below reorder_level so the
  -- low-stock trigger generates real notifications.
  insert into public.stock_levels (org_id, product_id, warehouse_id, quantity_on_hand)
  select v_org, pr.id, s.warehouse_id, s.qty
  from public.products pr
  join (values
    ('BEV-SUG-2K', v_wh_ho, 120), ('BEV-SUG-2K', v_wh_byo, 40),
    ('BEV-MAZ-2L', v_wh_ho, 60),  ('BEV-MAZ-2L', v_wh_byo, 25),
    ('BEV-TAN-100', v_wh_ho, 8),  ('BEV-TAN-100', v_wh_byo, 15),
    ('GRO-MM-10K', v_wh_ho, 95),  ('GRO-MM-10K', v_wh_byo, 30),
    ('GRO-OIL-2L', v_wh_ho, 70),  ('GRO-OIL-2L', v_wh_byo, 4),
    ('GRO-BREAD', v_wh_ho, 45),   ('GRO-BREAD', v_wh_byo, 20),
    ('ELE-SOL-100', v_wh_ho, 12), ('ELE-SOL-100', v_wh_byo, 3),
    ('ELE-BAT-100', v_wh_ho, 2),  ('ELE-BAT-100', v_wh_byo, 1),
    ('ELE-LED-9W', v_wh_ho, 150), ('ELE-LED-9W', v_wh_byo, 60),
    ('HW-CEM-50', v_wh_ho, 80),   ('HW-CEM-50', v_wh_byo, 35)
  ) as s(sku, warehouse_id, qty) on pr.org_id = v_org and pr.sku = s.sku;

  -- Customers (credit limits + payment terms drive AR behaviour).
  insert into public.customers (org_id, name, customer_type, email, phone, address, credit_limit, payment_terms_days) values
    (v_org,'Acme Retail (Pvt) Ltd','business','orders@acmeretail.co.zw','+263 242 700 111',jsonb_build_object('city','Harare','country','Zimbabwe'),5000,30),
    (v_org,'Tendai Mukono','individual','tendai.m@example.com','+263 77 555 0192',jsonb_build_object('city','Harare','country','Zimbabwe'),null,0),
    (v_org,'Chitungwiza Mini Market','business','chitumini@example.com','+263 71 402 8873',jsonb_build_object('city','Chitungwiza','country','Zimbabwe'),2000,14),
    (v_org,'Rudo Dube','individual','rudo.d@example.com','+263 78 210 4490',jsonb_build_object('city','Bulawayo','country','Zimbabwe'),null,0),
    (v_org,'Harare Hardware Supplies','business','sales@hwhardware.co.zw','+263 242 611 900',jsonb_build_object('city','Harare','country','Zimbabwe'),10000,45);

  select id into v_c1 from public.customers where org_id = v_org and name = 'Acme Retail (Pvt) Ltd';
  select id into v_c2 from public.customers where org_id = v_org and name = 'Tendai Mukono';
  select id into v_c3 from public.customers where org_id = v_org and name = 'Chitungwiza Mini Market';
  select id into v_c4 from public.customers where org_id = v_org and name = 'Rudo Dube';
  select id into v_c5 from public.customers where org_id = v_org and name = 'Harare Hardware Supplies';

  insert into public.suppliers (org_id, name, email, phone, tax_number, address) values
    (v_org,'National Foods Distributors','sales@nationalfoods.co.zw','+263 242 620 100','VAT-0099123',jsonb_build_object('city','Harare','country','Zimbabwe')),
    (v_org,'Delta Beverages Wholesale','orders@deltabev.co.zw','+263 242 486 000','VAT-0044556',jsonb_build_object('city','Harare','country','Zimbabwe')),
    (v_org,'Solar Tech Zimbabwe','sales@solartech.co.zw','+263 242 771 450','VAT-0077889',jsonb_build_object('city','Harare','country','Zimbabwe')),
    (v_org,'PPC Cement Zimbabwe','orders@ppc.co.zw','+263 242 753 200','VAT-0011223',jsonb_build_object('city','Bulawayo','country','Zimbabwe'));
  select id into v_s1 from public.suppliers where org_id = v_org and name = 'National Foods Distributors';
  select id into v_s2 from public.suppliers where org_id = v_org and name = 'Delta Beverages Wholesale';
  select id into v_s3 from public.suppliers where org_id = v_org and name = 'Solar Tech Zimbabwe';
  select id into v_s4 from public.suppliers where org_id = v_org and name = 'PPC Cement Zimbabwe';

  -- POS sessions: one closed yesterday (with a small overage), one open today.
  insert into public.pos_sessions (org_id, register_id, opened_by, opening_float, closing_float, status, opened_at, closed_at)
  values
    (v_org, v_reg, v_user, 50.00, 216.00, 'closed', now() - interval '1 day' + interval '9 hours', now() - interval '1 day' + interval '17 hours')
  returning id into v_session_closed;
  insert into public.pos_sessions (org_id, register_id, opened_by, opening_float, status, opened_at)
  values (v_org, v_reg, v_user, 50.00, 'open', now() - interval '2 hours')
  returning id into v_session_open;

  -- ---------- Invoices ----------
  -- INV-000001: 40 days old, fully paid (bank transfer).
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, due_date, issued_at, created_by, created_at)
  values
    (v_org, v_ho, v_c1, 'INV-000001', 'paid', 465.00, 69.75, 534.75, 534.75, 'USD', current_date - 10, now() - interval '40 days', v_user, now() - interval '40 days')
  returning id into v_inv;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select v_inv, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values ('GRO-MM-10K',30,8.95),('GRO-OIL-2L',20,5.25),('BEV-SUG-2K',30,3.20)) li(sku,qty,price)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  insert into public.sales_payments (org_id, invoice_id, amount, method, reference, paid_at, recorded_by)
  values (v_org, v_inv, 534.75, 'bank_transfer', 'RTGS-88012', now() - interval '30 days', v_user);

  -- INV-000002: 32 days old, paid cash.
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, due_date, issued_at, created_by, created_at)
  values
    (v_org, v_ho, v_c2, 'INV-000002', 'paid', 129.13, 19.37, 148.50, 148.50, 'USD', current_date - 30, now() - interval '32 days', v_user, now() - interval '32 days')
  returning id into v_inv;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select v_inv, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values ('ELE-SOL-100',1,69.99),('ELE-LED-9W',15,2.50),('BEV-TAN-100',2,4.50)) li(sku,qty,price)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  insert into public.sales_payments (org_id, invoice_id, amount, method, paid_at, recorded_by)
  values (v_org, v_inv, 148.50, 'cash', now() - interval '32 days', v_user);

  -- INV-000003: 20 days old, 14-day terms — overdue, partially paid.
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, due_date, issued_at, created_by, created_at)
  values
    (v_org, v_ho, v_c3, 'INV-000003', 'partially_paid', 365.22, 54.78, 420.00, 150.00, 'USD', current_date - 6, now() - interval '20 days', v_user, now() - interval '20 days')
  returning id into v_inv;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select v_inv, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values ('GRO-MM-10K',20,8.95),('BEV-MAZ-2L',40,2.75),('GRO-BREAD',60,1.25)) li(sku,qty,price)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  insert into public.sales_payments (org_id, invoice_id, amount, method, paid_at, recorded_by)
  values (v_org, v_inv, 150.00, 'cash', now() - interval '8 days', v_user);

  -- INV-000004: 12 days old, issued, due in ~18 days — open AR.
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, due_date, issued_at, created_by, created_at)
  values
    (v_org, v_ho, v_c5, 'INV-000004', 'issued', 678.61, 101.79, 780.40, 0, 'USD', current_date + 33, now() - interval '12 days', v_user, now() - interval '12 days')
  returning id into v_inv;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select v_inv, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values ('HW-CEM-50',50,11.50),('ELE-BAT-100',1,289.00)) li(sku,qty,price)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;

  -- INV-000005: 5 days old, paid via EcoCash.
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, due_date, issued_at, created_by, created_at)
  values
    (v_org, v_ho, v_c4, 'INV-000005', 'paid', 54.17, 8.13, 62.30, 62.30, 'USD', current_date + 25, now() - interval '5 days', v_user, now() - interval '5 days')
  returning id into v_inv;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select v_inv, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values ('BEV-MAZ-2L',12,2.75),('GRO-BREAD',8,1.25),('BEV-TAN-100',4,4.50)) li(sku,qty,price)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  insert into public.sales_payments (org_id, invoice_id, amount, method, reference, paid_at, recorded_by)
  values (v_org, v_inv, 62.30, 'ecocash', 'ECX-44719', now() - interval '5 days', v_user);

  -- INV-000006: draft — created today, not yet issued.
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, created_by, created_at)
  values
    (v_org, v_ho, v_c1, 'INV-000006', 'draft', 182.61, 27.39, 210.00, 0, 'USD', v_user, now() - interval '3 hours')
  returning id into v_inv;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select v_inv, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values ('ELE-SOL-100',2,69.99),('ELE-LED-9W',20,2.50)) li(sku,qty,price)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;

  -- POS sales from yesterday's closed session.
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, pos_session_id, issued_at, created_by, created_at)
  values
    (v_org, v_ho, null, 'INV-000007', 'paid', 97.83, 14.67, 112.50, 112.50, 'USD', v_session_closed, now() - interval '1 day' + interval '11 hours', v_user, now() - interval '1 day' + interval '11 hours'),
    (v_org, v_ho, v_c2, 'INV-000008', 'paid', 45.65, 6.85, 52.50, 52.50, 'USD', v_session_closed, now() - interval '1 day' + interval '14 hours', v_user, now() - interval '1 day' + interval '14 hours')
  ;
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select i.id, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values
    ('INV-000007','GRO-MM-10K',8,8.95),('INV-000007','GRO-OIL-2L',5,5.25),
    ('INV-000008','BEV-SUG-2K',10,3.20),('INV-000008','GRO-BREAD',16,1.25)
  ) li(inv,sku,qty,price)
  join public.sales_invoices i on i.org_id = v_org and i.invoice_number = li.inv
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  insert into public.sales_payments (org_id, invoice_id, amount, method, paid_at, recorded_by)
  select v_org, i.id, i.total, 'cash', now() - interval '1 day' + interval '15 hours', v_user
  from public.sales_invoices i
  where i.org_id = v_org and i.invoice_number in ('INV-000007','INV-000008');

  -- POS sales on today's open session (mixed tender on one).
  insert into public.sales_invoices
    (org_id, branch_id, customer_id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, pos_session_id, issued_at, created_by, created_at)
  values
    (v_org, v_ho, v_c4, 'INV-000009', 'paid', 30.35, 4.55, 34.90, 34.90, 'USD', v_session_open, now() - interval '90 minutes', v_user, now() - interval '90 minutes'),
    (v_org, v_ho, null, 'INV-000010', 'paid', 78.26, 11.74, 90.00, 90.00, 'USD', v_session_open, now() - interval '40 minutes', v_user, now() - interval '40 minutes');
  insert into public.sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
  select i.id, pr.id, pr.name, li.qty, li.price, li.qty * li.price
  from (values
    ('INV-000009','BEV-MAZ-2L',10,2.75),('INV-000009','GRO-BREAD',2,1.25),('INV-000009','BEV-TAN-100',1,4.50),
    ('INV-000010','ELE-SOL-100',1,69.99),('INV-000010','GRO-OIL-2L',3,5.25)
  ) li(inv,sku,qty,price)
  join public.sales_invoices i on i.org_id = v_org and i.invoice_number = li.inv
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  -- INV-000009 cash; INV-000010 split tender: $50 cash + $40 card.
  insert into public.sales_payments (org_id, invoice_id, amount, method, paid_at, recorded_by)
  select v_org, i.id, p.amount, p.method, now() - interval '35 minutes', v_user
  from public.sales_invoices i
  join (values ('INV-000009',34.90,'cash'),('INV-000010',50.00,'cash'),('INV-000010',40.00,'card')) p(inv,amount,method)
    on i.org_id = v_org and i.invoice_number = p.inv;

  -- One parked order on the open session so Held Orders is visible.
  insert into public.pos_held_orders (org_id, session_id, register_id, customer_id, label, cart, held_by)
  values (
    v_org, v_session_open, v_reg, v_c2, 'Tendai — waiting on transfer',
    jsonb_build_array(
      jsonb_build_object('product_id', (select id from public.products where org_id = v_org and sku = 'GRO-MM-10K'), 'name', 'Mealie Meal 10kg', 'unit_price', 8.95, 'quantity', 3),
      jsonb_build_object('product_id', (select id from public.products where org_id = v_org and sku = 'BEV-SUG-2K'), 'name', 'Cane Sugar 2kg', 'unit_price', 3.20, 'quantity', 5)
    ),
    v_user
  );

  -- ---------- Expenses across the approval lifecycle ----------
  -- submitted (fires notify_expense_submitted → real notifications)
  insert into public.expenses (org_id, branch_id, account_id, description, amount, expense_date, payment_method, status, submitted_by, submitted_at, created_by, created_at)
  select v_org, v_ho, a.id, e.description, e.amount, e.expense_date, e.method, 'submitted', v_user, now() - e.ago, v_user, now() - e.ago
  from (values
    ('5400','Printer paper & toner for front office',38.00,current_date - 1,'cash',interval '1 day'),
    ('5700','RTGS bank charges — October',12.50,current_date - 2,'bank_transfer',interval '2 days')
  ) e(acc_code,description,amount,expense_date,method,ago)
  join public.accounts a on a.org_id = v_org and a.code = e.acc_code;
  -- approved, awaiting payment
  insert into public.expenses (org_id, branch_id, account_id, description, amount, expense_date, payment_method, status, submitted_by, submitted_at, approved_by, approved_at, created_by, created_at)
  select v_org, v_ho, a.id, 'Fuel for delivery run to Chitungwiza',96.00,current_date - 4,'cash','approved',v_user,now() - interval '5 days',v_user,now() - interval '3 days',v_user,now() - interval '5 days'
  from public.accounts a where a.org_id = v_org and a.code = '5600';
  -- paid
  insert into public.expenses (org_id, branch_id, account_id, description, amount, expense_date, payment_method, status, submitted_by, submitted_at, approved_by, approved_at, created_by, created_at)
  select v_org, v_ho, a.id, e.description, e.amount, e.expense_date, e.method,'paid',v_user,now() - e.submitted_ago,v_user,now() - e.approved_ago,v_user,now() - e.submitted_ago
  from (values
    ('5100','Shop rent — Harare premises, October',850.00,current_date - 12,'bank_transfer',interval '15 days',interval '13 days'),
    ('5300','ZESA electricity top-up',142.00,current_date - 9,'ecocash',interval '10 days',interval '9 days')
  ) e(acc_code,description,amount,expense_date,method,submitted_ago,approved_ago)
  join public.accounts a on a.org_id = v_org and a.code = e.acc_code;
  -- rejected
  insert into public.expenses (org_id, branch_id, account_id, description, amount, expense_date, payment_method, status, submitted_by, submitted_at, approved_by, approved_at, rejection_reason, created_by, created_at)
  select v_org, v_ho, a.id, 'Branded flyers print run (quote 2)',55.00,current_date - 7,'cash','rejected',v_user,now() - interval '8 days',v_user,now() - interval '7 days','Over budget — use the approved print vendor instead.',v_user,now() - interval '8 days'
  from public.accounts a where a.org_id = v_org and a.code = '5500';

  -- ---------- Purchase orders ----------
  -- PO-000001: issued, expected in 5 days.
  insert into public.purchase_orders (org_id, branch_id, supplier_id, po_number, status, subtotal, tax_total, total, amount_paid, expected_date, notes, created_by, created_at)
  values (v_org, v_ho, v_s1, 'PO-000001', 'issued', 520.00, 78.00, 598.00, 0, current_date + 5, 'Monthly restock — dry goods', v_user, now() - interval '15 days')
  returning id into v_po;
  insert into public.purchase_order_items (po_id, product_id, description, quantity, unit_cost, line_total)
  select v_po, pr.id, pr.name, li.qty, li.cost, li.qty * li.cost
  from (values ('GRO-MM-10K',50,6.50),('GRO-OIL-2L',25,3.80)) li(sku,qty,cost)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  -- PO-000002: issued, expected 3 days ago — LATE (feeds the dashboard).
  insert into public.purchase_orders (org_id, branch_id, supplier_id, po_number, status, subtotal, tax_total, total, amount_paid, expected_date, notes, created_by, created_at)
  values (v_org, v_ho, v_s3, 'PO-000002', 'issued', 954.68, 143.20, 1097.88, 0, current_date - 3, 'Solar stock for Q4 promos', v_user, now() - interval '20 days')
  returning id into v_po;
  insert into public.purchase_order_items (po_id, product_id, description, quantity, unit_cost, line_total)
  select v_po, pr.id, pr.name, li.qty, li.cost, li.qty * li.cost
  from (values ('ELE-SOL-100',15,45.00),('ELE-BAT-100',1,180.00)) li(sku,qty,cost)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  -- PO-000003: received + fully paid.
  insert into public.purchase_orders (org_id, branch_id, supplier_id, po_number, status, subtotal, tax_total, total, amount_paid, expected_date, received_at, created_by, created_at)
  values (v_org, v_ho, v_s2, 'PO-000003', 'received', 189.00, 28.35, 217.35, 217.35, current_date - 12, now() - interval '10 days', v_user, now() - interval '25 days')
  returning id into v_po;
  insert into public.purchase_order_items (po_id, product_id, description, quantity, unit_cost, line_total)
  select v_po, pr.id, pr.name, li.qty, li.cost, li.qty * li.cost
  from (values ('BEV-MAZ-2L',60,1.80),('BEV-TAN-100',20,3.10),('BEV-SUG-2K',20,2.40)) li(sku,qty,cost)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;
  insert into public.purchase_payments (org_id, po_id, amount, method, reference, paid_at)
  values (v_org, v_po, 217.35, 'bank_transfer', 'RTGS-87714', now() - interval '11 days');

  -- ---------- One stock transfer in transit ----------
  insert into public.warehouse_transfers (org_id, transfer_number, from_warehouse_id, to_warehouse_id, transfer_date, status, notes, requested_by)
  values (v_org, 'WHT-20251108-A1B2C3', v_wh_ho, v_wh_byo, current_date - 1, 'pending', 'Weekly Bulawayo restock', v_user)
  returning id into v_inv; -- reuse var as scratch
  insert into public.warehouse_transfer_lines (org_id, transfer_id, product_id, quantity, unit)
  select v_org, v_inv, pr.id, li.qty, 'ea'
  from (values ('GRO-MM-10K',20),('GRO-OIL-2L',10),('GRO-BREAD',15)) li(sku,qty)
  join public.products pr on pr.org_id = v_org and pr.sku = li.sku;

  -- Keep numbering ahead of seeded docs so future invoices/POs continue cleanly.
  insert into public.numbering_sequences (org_id, entity_type, prefix, next_number) values
    (v_org, 'sales_invoice', 'INV-', 11),
    (v_org, 'purchase_order', 'PO-', 4),
    (v_org, 'credit_note', 'CN-', 1)
  on conflict (org_id, entity_type) do update
  set next_number = greatest(numbering_sequences.next_number, excluded.next_number);

  -- Org contact settings for the print layout.
  insert into public.org_settings (org_id, key, value) values
    (v_org, 'contact.phone', '"+263 77 123 4567"'::jsonb),
    (v_org, 'contact.email', '"sales@democompany.co.zw"'::jsonb),
    (v_org, 'invoice.footer', '"Thank you for your business. Payment terms as agreed; goods remain property of Demo Company until paid in full."'::jsonb),
    (v_org, 'tax.default_rate', '"15%"'::jsonb)
  on conflict (org_id, key) do update set value = excluded.value;
end $$;
