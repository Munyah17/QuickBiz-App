-- Risk & Insurance Enhancement: Pre-integrated insurers catalog
-- Users can activate pre-configured insurers instead of manual onboarding

-- Add insurer catalog (global reference data like integration_providers)
create table if not exists public.insurer_catalog (
  key text primary key,
  name text not null,
  category text not null check (category in ('general', 'motor', 'property', 'liability', 'health', 'workers_comp', 'marine', 'aviation', 'other')),
  description text not null,
  contact_email text,
  contact_phone text,
  website text,
  coverage_types jsonb default '[]'::jsonb,
  regions jsonb default '[]'::jsonb,
  is_active boolean not null default true
);

-- Seed with common Zimbabwe/regional insurers
insert into public.insurer_catalog (key, name, category, description, contact_email, contact_phone, website, coverage_types, regions) values
  ('old_mutual', 'Old Mutual', 'general', 'Leading Zimbabwean insurer offering life assurance, asset management, and general insurance.', 'info@oldmutual.co.zw', '+263 4 777 777', 'https://www.oldmutual.co.zw', '["motor", "property", "liability", "health", "life"]'::jsonb, '["ZW"]'::jsonb),
  ('cbz_insurance', 'CBZ Insurance', 'general', 'Comprehensive insurance solutions from CBZ Holdings, including motor, property, and business insurance.', 'insurance@cbz.co.zw', '+263 4 777 000', 'https://www.cbz.co.zw', '["motor", "property", "liability", "business"]'::jsonb, '["ZW"]'::jsonb),
  ('fidelity_life', 'Fidelity Life Assurance', 'general', 'Life and health insurance provider with investment-linked products.', 'info@fidelitylife.co.zw', '+263 4 777 111', 'https://www.fidelitylife.co.zw', '["life", "health", "investment"]'::jsonb, '["ZW"]'::jsonb),
  ('zimnat', 'Zimnat Life Assurance', 'general', 'Long-standing Zimbabwean insurer offering life assurance and health insurance.', 'info@zimnat.co.zw', '+263 4 777 222', 'https://www.zimnat.co.zw', '["life", "health", "motor"]'::jsonb, '["ZW"]'::jsonb),
  ('first_mutual', 'First Mutual Life', 'general', 'Life assurance and investment products with focus on long-term financial security.', 'info@firstmutual.co.zw', '+263 4 777 333', 'https://www.firstmutual.co.zw', '["life", "investment", "pension"]'::jsonb, '["ZW"]'::jsonb),
  ('sanlam', 'Sanlam', 'general', 'Pan-African financial services group with insurance and wealth management.', 'info@sanlam.com', '+263 4 777 444', 'https://www.sanlam.com', '["life", "health", "investment", "motor", "property"]'::jsonb, '["ZW", "ZA", "KE", "NA", "BW", "MW", "TZ", "UG", "ZM"]'::jsonb),
  ('allianz', 'Allianz', 'general', 'Global insurance company offering comprehensive risk solutions across multiple sectors.', 'info@allianz.com', '+49 180 5 99 99 99', 'https://www.allianz.com', '["motor", "property", "liability", "marine", "aviation", "health"]'::jsonb, '["global"]'::jsonb),
  ('aig', 'AIG', 'general', 'American International Group - global insurance and financial services.', 'info@aig.com', '+1 212 770 7000', 'https://www.aig.com', '["property", "casualty", "liability", "marine", "aviation"]'::jsonb, '["global"]'::jsonb),
  ('chubb', 'Chubb', 'general', 'Global property and casualty insurance company with specialty coverage.', 'info@chubb.com', '+1 201 702 5000', 'https://www.chubb.com', '["property", "casualty", "liability", "marine", "cyber"]'::jsonb, '["global"]'::jsonb),
  ('hiscox', 'Hiscox', 'general', 'Specialist insurer focused on high-value homes, businesses, and cyber risks.', 'info@hiscox.com', '+44 20 7260 5000', 'https://www.hiscox.com', '["property", "liability", "cyber", "professional"]'::jsonb, '["global"]'::jsonb)
on conflict (key) do nothing;

alter table public.insurer_catalog enable row level security;

create policy insurer_catalog_select on public.insurer_catalog
  for select to authenticated using (true);

-- Enhance insurers table to link to catalog and track activation status
alter table public.insurers
  add column if not exists catalog_key text references public.insurer_catalog(key) on delete set null,
  add column if not exists is_catalog_activated boolean not null default false,
  add column if not exists activation_date timestamptz;

-- RPC to activate a pre-integrated insurer
create or replace function public.activate_insurer(p_org_id uuid, p_catalog_key text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_insurer_id uuid;
  v_insurer_info public.insurer_catalog%rowtype;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'risk_insurance.manage') then
    raise exception 'insufficient permissions';
  end if;

  select * into v_insurer_info from public.insurer_catalog where key = p_catalog_key and is_active = true;
  
  if v_insurer_info is null then
    raise exception 'Insurer not found in catalog or not active';
  end if;

  -- Check if already activated
  if exists (select 1 from public.insurers where org_id = p_org_id and catalog_key = p_catalog_key) then
    raise exception 'Insurer already activated for this organization';
  end if;

  insert into public.insurers (org_id, code, name, contact_person, email, phone, website, catalog_key, is_catalog_activated, activation_date, created_by)
  values (
    p_org_id,
    upper(p_catalog_key) || '-' || upper(substr(gen_random_uuid()::text, 1, 6)),
    v_insurer_info.name,
    v_insurer_info.name,
    v_insurer_info.contact_email,
    v_insurer_info.contact_phone,
    v_insurer_info.website,
    p_catalog_key,
    true,
    now(),
    auth.uid()
  )
  returning id into v_insurer_id;

  return v_insurer_id;
end;
$$;

-- RPC to list available insurers from catalog
create or replace function public.list_available_insurers()
returns table (
  key text,
  name text,
  category text,
  description text,
  contact_email text,
  contact_phone text,
  website text,
  coverage_types jsonb,
  regions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    key, name, category, description, contact_email, contact_phone, website, coverage_types, regions
  from public.insurer_catalog
  where is_active = true
  order by name;
end;
$$;

-- RPC to list activated insurers for an org
create or replace function public.list_activated_insurers(p_org_id uuid)
returns table (
  id uuid,
  code text,
  name text,
  catalog_key text,
  activation_date timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'risk_insurance.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select id, code, name, catalog_key, activation_date, is_active
  from public.insurers
  where org_id = p_org_id and is_catalog_activated = true
  order by activation_date desc;
end;
$$;
