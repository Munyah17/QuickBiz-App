-- Tenant Management Integration
-- Adds tables and functions for tenant instances to communicate with the central management platform

-- Add management configuration to organizations
alter table public.organizations
  add column if not exists management_api_key text,
  add column if not exists management_api_url text,
  add column if not exists management_deployment_id uuid,
  add column if not exists is_linked_to_management boolean not null default false,
  add column if not exists last_sync_at timestamptz;

-- Create index for faster lookups
create index if not exists organizations_management_linked_idx on public.organizations (is_linked_to_management);

-- Module requests from tenant (outgoing to management platform)
create table if not exists public.outgoing_module_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  module_key text not null,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'quarterly', 'annual')),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected', 'cancelled')),
  management_request_id uuid, -- ID from management platform
  payment_amount numeric(10, 2),
  payment_status text check (payment_status in ('pending', 'completed', 'failed')),
  requested_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outgoing_module_requests_org_idx on public.outgoing_module_requests (org_id);
create index if not exists outgoing_module_requests_status_idx on public.outgoing_module_requests (status);

alter table public.outgoing_module_requests enable row level security;

create policy outgoing_module_requests_org_select on public.outgoing_module_requests
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy outgoing_module_requests_insert on public.outgoing_module_requests
  for insert to authenticated
  with check (org_id in (select public.user_org_ids()));

create trigger set_outgoing_module_requests_updated_at
  before update on public.outgoing_module_requests
  for each row execute function public.set_updated_at();

-- Sync log for tracking communication with management platform
create table if not exists public.management_sync_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sync_type text not null check (sync_type in ('heartbeat', 'module_request', 'audit_forward', 'support_ticket', 'module_sync')),
  status text not null check (status in ('success', 'failed', 'pending')),
  request_payload jsonb default '{}'::jsonb,
  response_payload jsonb default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists management_sync_logs_org_idx on public.management_sync_logs (org_id);
create index if not exists management_sync_logs_type_idx on public.management_sync_logs (sync_type);
create index if not exists management_sync_logs_created_at_idx on public.management_sync_logs (created_at);

alter table public.management_sync_logs enable row level security;

create policy management_sync_logs_org_select on public.management_sync_logs
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

-- RPC Functions

-- Link organization to management platform
create or replace function public.link_to_management(p_org_id uuid, p_api_key text, p_api_url text, p_deployment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'org.manage') then
    raise exception 'insufficient permissions';
  end if;

  update public.organizations
  set 
    management_api_key = p_api_key,
    management_api_url = p_api_url,
    management_deployment_id = p_deployment_id,
    is_linked_to_management = true,
    last_sync_at = now()
  where id = p_org_id;
end;
$$;

-- Unlink from management platform
create or replace function public.unlink_from_management(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'org.manage') then
    raise exception 'insufficient permissions';
  end if;

  update public.organizations
  set 
    management_api_key = null,
    management_api_url = null,
    management_deployment_id = null,
    is_linked_to_management = false,
    last_sync_at = null
  where id = p_org_id;
end;
$$;

-- Request module from management platform
create or replace function public.request_module_from_management(p_org_id uuid, p_module_key text, p_billing_cycle text default 'monthly')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_api_key text;
  v_api_url text;
  v_is_linked boolean;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'org.manage') then
    raise exception 'insufficient permissions';
  end if;

  -- Check if linked to management
  select management_api_key, management_api_url, is_linked_to_management 
  into v_api_key, v_api_url, v_is_linked
  from public.organizations 
  where id = p_org_id;

  if not v_is_linked or v_api_key is null or v_api_url is null then
    raise exception 'Organization not linked to management platform';
  end if;

  -- Check if module already enabled
  if exists (select 1 from public.org_modules where org_id = p_org_id and module_key = p_module_key and is_enabled = true) then
    raise exception 'Module already enabled for this organization';
  end if;

  -- Create outgoing request record
  insert into public.outgoing_module_requests (org_id, module_key, billing_cycle, status, requested_by)
  values (p_org_id, p_module_key, p_billing_cycle, 'pending', auth.uid())
  returning id into v_request_id;

  -- Log sync attempt
  insert into public.management_sync_logs (org_id, sync_type, status, request_payload)
  values (p_org_id, 'module_request', 'pending', jsonb_build_object(
    'module_key', p_module_key,
    'billing_cycle', p_billing_cycle,
    'request_id', v_request_id
  ));

  -- Note: The actual HTTP request to the management platform should be handled
  -- by the application layer, not in SQL. This function creates the record
  -- and the application layer will make the API call.

  return v_request_id;
end;
$$;

-- Update module request status (called after management platform response)
create or replace function public.update_module_request_status(p_request_id uuid, p_status text, p_management_request_id uuid default null, p_payment_amount numeric default null, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_module_key text;
  v_request outgoing_module_requests%rowtype;
begin
  select org_id, module_key into v_org_id, v_module_key
  from public.outgoing_module_requests
  where id = p_request_id;

  if v_org_id is null then
    raise exception 'Module request not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;

  update public.outgoing_module_requests
  set 
    status = p_status,
    management_request_id = p_management_request_id,
    payment_amount = p_payment_amount,
    notes = p_notes,
    updated_at = now()
  where id = p_request_id;

  -- If approved, enable the module
  if p_status = 'approved' then
    insert into public.org_modules (org_id, module_key, is_enabled, enabled_at)
    values (v_org_id, v_module_key, true, now())
    on conflict (org_id, module_key) do update set
      is_enabled = true,
      enabled_at = now();
  end if;
end;
$$;

-- Log sync result
create or replace function public.log_management_sync(p_org_id uuid, p_sync_type text, p_status text, p_request_payload jsonb default '{}'::jsonb, p_response_payload jsonb default '{}'::jsonb, p_error_message text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.management_sync_logs (org_id, sync_type, status, request_payload, response_payload, error_message)
  values (p_org_id, p_sync_type, p_status, p_request_payload, p_response_payload, p_error_message);
end;
$$;

-- Get management link status
create or replace function public.get_management_link_status(p_org_id uuid)
returns table (
  is_linked boolean,
  api_url text,
  deployment_id uuid,
  last_sync_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;

  return query
  select 
    is_linked_to_management as is_linked,
    management_api_url as api_url,
    management_deployment_id as deployment_id,
    last_sync_at
  from public.organizations
  where id = p_org_id;
end;
$$;

-- List outgoing module requests
create or replace function public.list_module_requests(p_org_id uuid, p_status text default null)
returns table (
  id uuid,
  module_key text,
  billing_cycle text,
  status text,
  payment_amount numeric,
  requested_at timestamptz,
  approved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;

  return query
  select 
    id, module_key, billing_cycle, status, payment_amount, submitted_at as requested_at, approved_at
  from public.outgoing_module_requests
  where org_id = p_org_id
    and (p_status is null or status = p_status)
  order by created_at desc;
end;
$$;
