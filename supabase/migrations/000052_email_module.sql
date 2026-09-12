-- Email Management Module: templates, campaigns, and send logs.
--
-- email_settings holds SMTP credentials. Its column is named
-- smtp_password_encrypted but nothing in this schema actually encrypts it
-- yet (no pgcrypto call anywhere here) - real encryption-at-rest for this
-- column is real future work, not implemented in this pass. In the
-- meantime it gets the same tighter-than-usual RLS treatment as other
-- credential-bearing tables in this schema (org_integration_connections in
-- 000035, org_social_accounts in 000043): SELECT is gated by email.manage,
-- not open to every org member.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('email', 'Email Management', 'Manage email templates, campaigns, and automated communications. Send marketing emails, notifications, invoices, and reports directly from the system.', 'marketing', 15)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('email.manage', 'Manage email templates, campaigns, and settings', 'marketing'),
  ('email.send', 'Send emails and campaigns', 'marketing'),
  ('email.view', 'View email history and templates', 'marketing')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('email.manage', 'email.send', 'email.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key = 'email.view'
on conflict do nothing;

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null,
  name text not null,
  subject text not null,
  body text not null,
  template_type text not null check (template_type in ('invoice', 'receipt', 'quote', 'purchase_order', 'notification', 'marketing', 'welcome', 'password_reset', 'other')),
  is_system boolean not null default false,
  variables jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, template_key)
);

create index if not exists email_templates_org_id_idx on public.email_templates (org_id);
create index if not exists email_templates_template_type_idx on public.email_templates (template_type);

alter table public.email_templates enable row level security;

create policy email_templates_select on public.email_templates
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy email_templates_write on public.email_templates
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'));

create trigger set_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  campaign_name text not null,
  subject text not null,
  from_name text,
  from_email text,
  template_id uuid references public.email_templates(id) on delete set null,
  target_audience text check (target_audience in ('all_customers', 'active_customers', 'specific_segment', 'all_leads', 'all_employees', 'custom')),
  recipient_filter jsonb default '{}'::jsonb,
  scheduled_date timestamptz,
  sent_date timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  total_recipients int default 0,
  sent_count int default 0,
  opened_count int default 0,
  clicked_count int default 0,
  bounced_count int default 0,
  created_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_campaigns_org_id_idx on public.email_campaigns (org_id);
create index if not exists email_campaigns_status_idx on public.email_campaigns (status);
create index if not exists email_campaigns_scheduled_date_idx on public.email_campaigns (scheduled_date);

alter table public.email_campaigns enable row level security;

create policy email_campaigns_select on public.email_campaigns
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy email_campaigns_write on public.email_campaigns
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'));

create trigger set_email_campaigns_updated_at
  before update on public.email_campaigns
  for each row execute function public.set_updated_at();

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  to_email text not null,
  to_name text,
  subject text not null,
  template_type text,
  status text not null check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_org_id_idx on public.email_logs (org_id);
create index if not exists email_logs_campaign_id_idx on public.email_logs (campaign_id);
create index if not exists email_logs_status_idx on public.email_logs (status);
create index if not exists email_logs_to_email_idx on public.email_logs (to_email);

alter table public.email_logs enable row level security;

create policy email_logs_select on public.email_logs
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.view'));

create table if not exists public.email_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('smtp', 'sendgrid', 'mailgun', 'ses', 'postmark', 'custom')),
  smtp_host text,
  smtp_port int,
  smtp_username text,
  smtp_password_encrypted text,
  from_email text not null,
  from_name text not null,
  reply_to_email text,
  is_default boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_settings_org_id_idx on public.email_settings (org_id);

alter table public.email_settings enable row level security;

create policy email_settings_select on public.email_settings
  for select to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'));

create policy email_settings_write on public.email_settings
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'email.manage'));

create trigger set_email_settings_updated_at
  before update on public.email_settings
  for each row execute function public.set_updated_at();

-- RPC functions

create or replace function public.create_email_template(p_org_id uuid, p_template_key text, p_name text, p_subject text, p_body text, p_template_type text, p_variables jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'email.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.email_templates (org_id, template_key, name, subject, body, template_type, variables, created_by, updated_by)
  values (p_org_id, p_template_key, p_name, p_subject, p_body, p_template_type, p_variables, auth.uid(), auth.uid())
  returning id into v_template_id;

  return v_template_id;
end;
$$;

create or replace function public.create_email_campaign(p_org_id uuid, p_campaign_name text, p_subject text, p_target_audience text, p_template_id uuid default null, p_scheduled_date timestamptz default null, p_recipient_filter jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'email.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.email_campaigns (org_id, campaign_name, subject, template_id, target_audience, scheduled_date, recipient_filter, created_by)
  values (p_org_id, p_campaign_name, p_subject, p_template_id, p_target_audience, p_scheduled_date, p_recipient_filter, auth.uid())
  returning id into v_campaign_id;

  return v_campaign_id;
end;
$$;

create or replace function public.list_email_campaigns(p_org_id uuid, p_status text default null, p_limit int default 50)
returns table (
  id uuid,
  campaign_name text,
  subject text,
  status text,
  scheduled_date timestamptz,
  total_recipients int,
  sent_count int,
  opened_count int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'email.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select id, campaign_name, subject, status, scheduled_date, total_recipients, sent_count, opened_count
  from public.email_campaigns
  where org_id = p_org_id
    and (p_status is null or status = p_status)
  order by created_at desc
  limit p_limit;
end;
$$;
