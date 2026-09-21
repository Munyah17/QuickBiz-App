-- Management Platform: Central control for multi-deployment architecture
-- Each client has their own hosting instance, all linked here for control,
-- billing, updates, support, and cross-instance audit.

-- Management platform is a separate database from tenant instances
-- This migration defines the management platform schema

-- Super admin roles (platform-level, not org-level)
create table if not exists platform_roles (
  key text primary key,
  name text not null,
  description text,
  permissions jsonb default '[]'::jsonb,
  is_system boolean not null default false
);

insert into platform_roles (key, name, description, permissions, is_system) values
  ('super_admin', 'Super Administrator', 'Full platform control - can manage all clients, deployments, billing, and system settings', '["clients.manage", "deployments.manage", "billing.manage", "modules.manage", "audit.view", "support.manage", "settings.manage"]'::jsonb, true),
  ('billing_admin', 'Billing Administrator', 'Manage billing, payments, and subscriptions', '["billing.manage", "clients.view"]'::jsonb, true),
  ('support_admin', 'Support Administrator', 'Manage support tickets and client communications', '["support.manage", "clients.view", "deployments.view"]'::jsonb, true),
  ('deployment_admin', 'Deployment Administrator', 'Manage deployments, updates, and instance health', '["deployments.manage", "clients.view", "audit.view"]'::jsonb, true)
on conflict (key) do nothing;

-- Platform users (super admins, not tenant users)
create table if not exists platform_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role_key text not null references platform_roles(key) on delete restrict,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_users_role_idx on platform_users (role_key);

-- Clients (organizations that have deployed instances)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_code text not null unique,
  org_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  billing_email text,
  status text not null default 'active' check (status in ('active', 'suspended', 'terminated', 'trial')),
  trial_end_date date,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'quarterly', 'annual')),
  payment_method jsonb default '{}'::jsonb,
  notes text,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_status_idx on clients (status);
create index if not exists clients_trial_end_idx on clients (trial_end_date);

-- Deployments (individual instances per client)
create table if not exists deployments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  deployment_code text not null unique,
  instance_name text not null,
  environment text not null default 'production' check (environment in ('production', 'staging', 'development')),
  instance_url text not null,
  api_key text not null unique, -- Used for instance-to-management auth
  api_key_hash text not null, -- Hashed version for security
  version text not null,
  database_version text,
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance', 'error')),
  last_heartbeat_at timestamptz,
  last_sync_at timestamptz,
  deployed_at timestamptz not null default now(),
  deployed_by uuid references platform_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deployments_client_id_idx on deployments (client_id);
create index if not exists deployments_status_idx on deployments (status);
create index if not exists deployments_last_heartbeat_idx on deployments (last_heartbeat_at);

-- Module catalog (available modules with pricing)
create table if not exists module_catalog (
  key text primary key,
  name text not null,
  description text not null,
  category text not null,
  monthly_price_usd numeric(10, 2) not null,
  annual_discount_percent numeric(5, 2) default 0,
  is_active boolean not null default true,
  version text,
  requires_dependencies jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed module catalog with existing modules
insert into module_catalog (key, name, description, category, monthly_price_usd, annual_discount_percent) values
  ('local_services', 'Local Services', 'Pre-integrated Zimbabwean and regional payment, mobile money, banking, SMS, and tax services', 'platform', 15, 10),
  ('iban', 'International Payments (IBAN)', 'Request your own IBAN to receive international payments', 'finance', 25, 15),
  ('social_media', 'Social Media Management', 'Draft, schedule, and organize posts across multiple social media platforms', 'marketing', 20, 10),
  ('tax_compliance', 'Tax Compliance & ZIMRA', 'Track tax periods, filings, payments, and fiscal device registrations', 'finance', 35, 15),
  ('tender_bidding', 'Tender Bidding', 'Manage tender creation, supplier bidding, and procurement processes', 'procurement', 25, 10),
  ('risk_insurance', 'Risk & Insurance', 'Comprehensive risk management and insurance tracking', 'operations', 20, 10),
  ('sheq', 'SHEQ Management', 'Safety, Health, Environment, and Quality management', 'operations', 25, 10),
  ('disciplinary', 'Disciplinary Management', 'Manage employee disciplinary cases, warnings, and hearings', 'hr', 15, 10),
  ('email', 'Email Management', 'Manage email templates, campaigns, and automated communications', 'marketing', 15, 10),
  ('warehousing', 'Warehousing & Warehouse Management', 'Complete warehouse management with multi-location support', 'inventory', 30, 15),
  ('stock_take', 'Stock Take & Inventory Count', 'Physical inventory counting and reconciliation', 'inventory', 20, 10)
on conflict (key) do nothing;

-- Client module subscriptions (which modules each client has enabled)
create table if not exists client_module_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  module_key text not null references module_catalog(key) on delete cascade,
  deployment_id uuid references deployments(id) on delete cascade, -- Null if applies to all deployments
  status text not null default 'active' check (status in ('pending_payment', 'active', 'suspended', 'cancelled')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'quarterly', 'annual')),
  price_usd numeric(10, 2) not null,
  start_date date not null,
  end_date date,
  auto_renew boolean not null default true,
  approved_by uuid references platform_users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, module_key, deployment_id)
);

create index if not exists client_module_subscriptions_client_idx on client_module_subscriptions (client_id);
create index if not exists client_module_subscriptions_status_idx on client_module_subscriptions (status);
create index if not exists client_module_subscriptions_end_date_idx on client_module_subscriptions (end_date);

-- Module requests (when a client requests a new module)
create table if not exists module_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  deployment_id uuid references deployments(id) on delete cascade,
  module_key text not null references module_catalog(key) on delete cascade,
  requested_by text not null, -- Email or identifier of requester from instance
  request_source text not null, -- API, portal, support
  status text not null default 'pending' check (status in ('pending', 'awaiting_payment', 'processing_payment', 'approved', 'rejected', 'cancelled')),
  billing_cycle text default 'monthly',
  payment_amount numeric(10, 2),
  payment_reference text,
  payment_method jsonb default '{}'::jsonb,
  payment_status text check (payment_status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  approved_by uuid references platform_users(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists module_requests_client_idx on module_requests (client_id);
create index if not exists module_requests_status_idx on module_requests (status);
create index if not exists module_requests_created_at_idx on module_requests (created_at);

-- Billing invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  invoice_number text not null unique,
  billing_period_start date not null,
  billing_period_end date not null,
  subtotal_usd numeric(12, 2) not null,
  tax_usd numeric(12, 2) default 0,
  discount_usd numeric(12, 2) default 0,
  total_usd numeric(12, 2) not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_date date,
  payment_method jsonb default '{}'::jsonb,
  payment_reference text,
  sent_by uuid references platform_users(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_idx on invoices (client_id);
create index if not exists invoices_status_idx on invoices (status);
create index if not exists invoices_due_date_idx on invoices (due_date);

-- Invoice line items
create table if not exists invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  module_key text references module_catalog(key) on delete set null,
  quantity int not null default 1,
  unit_price_usd numeric(10, 2) not null,
  line_total_usd numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_idx on invoice_line_items (invoice_id);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  payment_reference text not null unique,
  amount_usd numeric(12, 2) not null,
  payment_method jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  processed_at timestamptz,
  gateway_response jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_client_idx on payments (client_id);
create index if not exists payments_invoice_idx on payments (invoice_id);
create index if not exists payments_status_idx on payments (status);
create index if not exists payments_reference_idx on payments (payment_reference);

-- Cross-instance audit logs (forwarded from tenant instances)
create table if not exists cross_instance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  deployment_id uuid references deployments(id) on delete set null,
  instance_org_id uuid, -- Original org_id from tenant instance
  module text not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  changes jsonb default '{}'::jsonb,
  performed_by text, -- User identifier from instance
  performed_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists cross_instance_audit_logs_client_idx on cross_instance_audit_logs (client_id);
create index if not exists cross_instance_audit_logs_deployment_idx on cross_instance_audit_logs (deployment_id);
create index if not exists cross_instance_audit_logs_performed_at_idx on cross_instance_audit_logs (performed_at);
create index if not exists cross_instance_audit_logs_module_idx on cross_instance_audit_logs (module);

-- Support tickets
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  deployment_id uuid references deployments(id) on delete set null,
  ticket_number text not null unique,
  subject text not null,
  description text not null,
  category text not null check (category in ('technical', 'billing', 'feature_request', 'bug_report', 'other')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_client', 'resolved', 'closed')),
  assigned_to uuid references platform_users(id) on delete set null,
  reported_by text not null,
  reported_email text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_client_idx on support_tickets (client_id);
create index if not exists support_tickets_status_idx on support_tickets (status);
create index if not exists support_tickets_assigned_idx on support_tickets (assigned_to);

-- Support ticket comments
create table if not exists support_ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  comment text not null,
  is_internal boolean not null default false,
  author_id uuid references platform_users(id) on delete set null,
  author_name text,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_comments_ticket_idx on support_ticket_comments (ticket_id);

-- System settings
create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references platform_users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Seed system settings
insert into system_settings (key, value, description) values
  ('payment_gateways', '{"enabled": ["stripe", "payfast"], "default": "stripe"}'::jsonb, 'Available payment gateways'),
  ('auto_approve_modules', '{"enabled": true, "require_payment": true}'::jsonb, 'Auto-approve modules after payment'),
  ('trial_days', '{"days": 30}'::jsonb, 'Default trial period in days'),
  ('support_email', '{"email": "support@quickbiz.local"}'::jsonb, 'Support contact email')
on conflict (key) do nothing;

-- Triggers for updated_at
create trigger set_clients_updated_at
  before update on clients
  for each row execute function public.set_updated_at();

create trigger set_deployments_updated_at
  before update on deployments
  for each row execute function public.set_updated_at();

create trigger set_module_catalog_updated_at
  before update on module_catalog
  for each row execute function public.set_updated_at();

create trigger set_client_module_subscriptions_updated_at
  before update on client_module_subscriptions
  for each row execute function public.set_updated_at();

create trigger set_module_requests_updated_at
  before update on module_requests
  for each row execute function public.set_updated_at();

create trigger set_invoices_updated_at
  before update on invoices
  for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
  before update on payments
  for each row execute function public.set_updated_at();

create trigger set_support_tickets_updated_at
  before update on support_tickets
  for each row execute function public.set_updated_at();

create trigger set_system_settings_updated_at
  before update on system_settings
  for each row execute function public.set_updated_at();

-- RPC Functions

-- Create new client
create or replace function create_client(
  p_org_name text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text default null,
  p_billing_email text default null,
  p_trial_days int default 30
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_client_code text;
  v_trial_end_date date;
begin
  v_client_code := 'CLI-' || upper(substr(gen_random_uuid()::text, 1, 8));
  v_trial_end_date := current_date + p_trial_days;

  insert into clients (client_code, org_name, contact_name, contact_email, contact_phone, billing_email, trial_end_date, status, created_by)
  values (v_client_code, p_org_name, p_contact_name, p_contact_email, p_contact_phone, p_billing_email, v_trial_end_date, 'trial', auth.uid())
  returning id into v_client_id;

  return v_client_id;
end;
$$;

-- Register deployment for a client
create or replace function register_deployment(
  p_client_id uuid,
  p_instance_name text,
  p_environment text,
  p_instance_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deployment_id uuid;
  v_deployment_code text;
  v_api_key text;
  v_api_key_hash text;
begin
  v_deployment_code := 'DEP-' || upper(substr(gen_random_uuid()::text, 1, 8));
  v_api_key := 'sk-' || lower(gen_random_uuid()::text);
  v_api_key_hash := encode(digest(v_api_key, 'sha256'), 'hex');

  insert into deployments (client_id, deployment_code, instance_name, environment, instance_url, api_key, api_key_hash, version, deployed_by)
  values (p_client_id, v_deployment_code, p_instance_name, p_environment, p_instance_url, v_api_key, v_api_key_hash, '1.0.0', auth.uid())
  returning id into v_deployment_id;

  return v_deployment_id;
end;
$$;

-- Request module (called from instance via API)
create or replace function request_module(
  p_api_key text,
  p_module_key text,
  p_billing_cycle text default 'monthly'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deployment_id uuid;
  v_client_id uuid;
  v_module_info module_catalog%rowtype;
  v_request_id uuid;
  v_price numeric(10, 2);
begin
  -- Authenticate via API key
  select id, client_id into v_deployment_id, v_client_id
  from deployments
  where api_key = p_api_key and status = 'active';

  if v_deployment_id is null then
    raise exception 'Invalid API key or inactive deployment';
  end if;

  -- Get module info
  select * into v_module_info from module_catalog where key = p_module_key and is_active = true;

  if v_module_info is null then
    raise exception 'Module not found or not available';
  end if;

  -- Check if already subscribed
  if exists (
    select 1 from client_module_subscriptions
    where client_id = v_client_id and module_key = p_module_key and status = 'active'
  ) then
    raise exception 'Module already active for this client';
  end;

  -- Calculate price based on billing cycle
  if p_billing_cycle = 'annual' then
    v_price := v_module_info.monthly_price_usd * 12 * (1 - v_module_info.annual_discount_percent / 100);
  else
    v_price := v_module_info.monthly_price_usd;
  end if;

  -- Create module request
  insert into module_requests (client_id, deployment_id, module_key, requested_by, request_source, billing_cycle, payment_amount, status)
  values (v_client_id, v_deployment_id, p_module_key, 'instance_api', 'api', p_billing_cycle, v_price, 'awaiting_payment')
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- Process payment and auto-approve module
create or replace function process_module_payment(
  p_request_id uuid,
  p_payment_reference text,
  p_payment_method jsonb,
  p_gateway_response jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request module_requests%rowtype;
  v_subscription_id uuid;
  v_start_date date;
  v_end_date date;
  v_settings jsonb;
  v_auto_approve boolean;
begin
  select * into v_request from module_requests where id = p_request_id;

  if v_request is null then
    raise exception 'Module request not found';
  end if;

  if v_request.status != 'pending' and v_request.status != 'awaiting_payment' then
    raise exception 'Module request already processed';
  end if;

  -- Check auto-approve setting
  select value into v_settings from system_settings where key = 'auto_approve_modules';
  v_auto_approve := coalesce((v_settings->>'enabled')::boolean, false);

  -- Create payment record
  insert into payments (client_id, payment_reference, amount_usd, payment_method, status, gateway_response)
  values (v_request.client_id, p_payment_reference, v_request.payment_amount, p_payment_method, 'completed', p_gateway_response);

  -- Update request status
  update module_requests
  set status = 'approved',
      payment_status = 'completed',
      payment_reference = p_payment_reference,
      payment_method = p_payment_method,
      approved_by = auth.uid(),
      approved_at = now()
  where id = p_request_id;

  -- Auto-approve if enabled
  if v_auto_approve then
    v_start_date := current_date;
    v_end_date := case
      when v_request.billing_cycle = 'annual' then v_start_date + interval '1 year'
      when v_request.billing_cycle = 'quarterly' then v_start_date + interval '3 months'
      else v_start_date + interval '1 month'
    end;

    insert into client_module_subscriptions (
      client_id, module_key, deployment_id, status, billing_cycle, price_usd, start_date, end_date, approved_by, approved_at
    )
    values (
      v_request.client_id, v_request.module_key, v_request.deployment_id, 'active',
      v_request.billing_cycle, v_request.payment_amount, v_start_date, v_end_date, auth.uid(), now()
    )
    returning id into v_subscription_id;

    return v_subscription_id;
  end;

  return p_request_id;
end;
$$;

-- Manual approve module (by super admin)
create or replace function approve_module_request(
  p_request_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request module_requests%rowtype;
  v_subscription_id uuid;
  v_start_date date;
  v_end_date date;
begin
  select * into v_request from module_requests where id = p_request_id;

  if v_request is null then
    raise exception 'Module request not found';
  end if;

  if v_request.status = 'approved' or v_request.status = 'rejected' then
    raise exception 'Module request already processed';
  end if;

  v_start_date := current_date;
  v_end_date := case
    when v_request.billing_cycle = 'annual' then v_start_date + interval '1 year'
    when v_request.billing_cycle = 'quarterly' then v_start_date + interval '3 months'
    else v_start_date + interval '1 month'
  end;

  insert into client_module_subscriptions (
    client_id, module_key, deployment_id, status, billing_cycle, price_usd, start_date, end_date, approved_by, approved_at, notes
  )
  values (
    v_request.client_id, v_request.module_key, v_request.deployment_id, 'active',
    v_request.billing_cycle, v_request.payment_amount, v_start_date, v_end_date, auth.uid(), now(), p_notes
  )
  returning id into v_subscription_id;

  update module_requests
  set status = 'approved', approved_by = auth.uid(), approved_at = now(), notes = p_notes
  where id = p_request_id;

  return v_subscription_id;
end;
$$;

-- Reject module request
create or replace function reject_module_request(
  p_request_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update module_requests
  set status = 'rejected', rejection_reason = p_reason, approved_by = auth.uid(), approved_at = now()
  where id = p_request_id;

  if not found then
    raise exception 'Module request not found';
  end if;
end;
$$;

-- Heartbeat from instance
create or replace function instance_heartbeat(p_api_key text, p_version text, p_database_version text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update deployments
  set last_heartbeat_at = now(), version = p_version, database_version = p_database_version
  where api_key = p_api_key;

  if not found then
    raise exception 'Invalid API key';
  end if;
end;
$$;

-- Forward audit log from instance
create or replace function forward_audit_log(
  p_api_key text,
  p_instance_org_id uuid,
  p_module text,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_changes jsonb,
  p_performed_by text,
  p_performed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deployment_id uuid;
  v_client_id uuid;
begin
  select id, client_id into v_deployment_id, v_client_id
  from deployments
  where api_key = p_api_key;

  if v_deployment_id is null then
    raise exception 'Invalid API key';
  end if;

  insert into cross_instance_audit_logs (
    client_id, deployment_id, instance_org_id, module, action, entity_type, entity_id, changes, performed_by, performed_at
  )
  values (v_client_id, v_deployment_id, p_instance_org_id, p_module, p_action, p_entity_type, p_entity_id, p_changes, p_performed_by, p_performed_at);
end;
$$;

-- Get active modules for a deployment (called by instance)
create or replace function get_deployment_modules(p_api_key text)
returns table (module_key text, status text, start_date date, end_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deployment_id uuid;
  v_client_id uuid;
begin
  select id, client_id into v_deployment_id, v_client_id
  from deployments
  where api_key = p_api_key;

  if v_deployment_id is null then
    raise exception 'Invalid API key';
  end if;

  return query
  select cms.module_key, cms.status, cms.start_date, cms.end_date
  from client_module_subscriptions cms
  where cms.client_id = v_client_id
    and (cms.deployment_id = v_deployment_id or cms.deployment_id is null)
    and cms.status = 'active'
    and (cms.end_date is null or cms.end_date >= current_date);
end;
$$;
