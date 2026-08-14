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
