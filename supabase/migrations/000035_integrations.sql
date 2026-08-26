-- Local Services (the "Integration Hub"): the platform's actual USP against
-- SAP-style foreign systems — every Zimbabwe-relevant payment, mobile
-- money, banking, SMS, and tax rail ships pre-built as one module, plug and
-- play with the org's own credentials (BYO-credentials), instead of the
-- thousands of bespoke integration projects a generic global ERP needs to
-- adapt to one local requirement. A toggleable, billed module like every
-- other one in module_catalog — not a free admin setting — matching "user
-- activates what they need and pays per module."  This migration does two
-- real things: (1) names these providers explicitly in the payment-method
-- vocabulary instead of burying them in a generic 'mobile_money'/'card'
-- bucket, and (2) lets an org store and mark a provider "connected" with
-- its own credentials. It deliberately does NOT fake a live gateway call —
-- actually charging a card/wallet or sending an SMS through these
-- providers' APIs needs real sandbox credentials to build and verify
-- against (spec's "no fake functionality" rule), so that stays future work.
-- What's here is genuinely functional: real credential storage, real
-- masking, real use as a payment method on real transactions.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('local_services', 'Local Services', 'Pre-integrated Zimbabwean and regional payment, mobile money, banking, SMS, and tax services - connect with your own credentials', 'platform', 15)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('integrations.manage', 'Connect and configure local services', 'platform')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('owner', 'director')
  and p.key = 'integrations.manage'
on conflict do nothing;

-- Expand payment method vocabulary to name Zimbabwe's actual local rails
-- instead of a generic 'mobile_money'/'card' bucket — bookkeeping now
-- records which specific provider a payment moved through.
alter table public.sales_payments drop constraint sales_payments_method_check;
alter table public.sales_payments add constraint sales_payments_method_check
  check (method in ('cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney', 'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast', 'card', 'other'));

alter table public.purchase_payments drop constraint purchase_payments_method_check;
alter table public.purchase_payments add constraint purchase_payments_method_check
  check (method in ('cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney', 'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast', 'card', 'other'));

alter table public.expenses drop constraint expenses_payment_method_check;
alter table public.expenses add constraint expenses_payment_method_check
  check (payment_method in ('cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney', 'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast', 'card', 'other'));

create table if not exists public.integration_providers (
  key text primary key,
  name text not null,
  category text not null check (category in ('mobile_money', 'gateway', 'bank_rail', 'card', 'sms', 'tax')),
  description text not null,
  credential_fields jsonb not null
);

insert into public.integration_providers (key, name, category, description, credential_fields) values
  -- Mobile money
  ('ecocash', 'EcoCash', 'mobile_money', 'Econet''s mobile money wallet, the most widely used in Zimbabwe.', '["Merchant number", "API key"]'),
  ('onemoney', 'OneMoney', 'mobile_money', 'NetOne''s mobile money wallet.', '["Merchant number", "API key"]'),
  ('omari', 'Omari', 'mobile_money', 'CBZ Bank''s mobile wallet.', '["Merchant number", "API key"]'),
  ('innbucks', 'InnBucks', 'mobile_money', 'Steward Bank''s digital wallet.', '["Merchant number", "API key"]'),
  ('zeepay', 'Zeepay', 'mobile_money', 'Pan-African mobile money aggregator operating in Zimbabwe.', '["Merchant ID", "API key"]'),
  ('contipay', 'ContiPay', 'mobile_money', 'Zimbabwean payment aggregator covering mobile money and cards.', '["Merchant ID", "API key"]'),
  -- Payment gateways
  ('paynow', 'Paynow', 'gateway', 'Zimbabwe''s payment gateway aggregator (EcoCash, OneMoney, Visa, Mastercard, ZIPIT in one integration).', '["Integration ID", "Integration key"]'),
  ('stripe', 'Stripe', 'gateway', 'International card and online payment gateway, for businesses billing customers abroad.', '["Publishable key", "Secret key"]'),
  ('payfast', 'PayFast', 'gateway', 'Southern African online payment gateway (cards, EFT) used by some Zimbabwean online businesses.', '["Merchant ID", "Merchant key"]'),
  -- Bank rails
  ('zipit', 'ZIPIT', 'bank_rail', 'RTGS-backed instant interbank transfer, used directly or through a bank.', '["Account number", "Bank name"]'),
  ('zimswitch', 'ZimSwitch', 'bank_rail', 'Zimbabwe''s national interbank switch (POS, ATM, and instant payments).', '["Merchant ID", "API key"]'),
  -- Card networks
  ('card', 'Visa / Mastercard', 'card', 'Card acquiring, typically routed through a local bank or Paynow.', '["Merchant ID", "API key"]'),
  -- SMS & messaging
  ('afrosoft', 'Afrosoft', 'sms', 'Zimbabwean bulk SMS gateway.', '["Account ID", "API key"]'),
  ('africas_talking', 'Africa''s Talking', 'sms', 'Pan-African SMS, USSD, and airtime API commonly used by Zimbabwean businesses.', '["Username", "API key"]'),
  ('whatsapp_business', 'WhatsApp Business', 'sms', 'WhatsApp Business Cloud API for quotes, receipts, and customer messages.', '["Phone number ID", "Access token"]'),
  ('twilio', 'Twilio', 'sms', 'International SMS and messaging API.', '["Account SID", "Auth token"]'),
  -- Tax & regulatory
  ('zimra', 'ZIMRA e-Services', 'tax', 'Zimbabwe Revenue Authority fiscalisation and e-invoicing (FDMS).', '["Device ID", "Certificate reference"]')
on conflict (key) do nothing;

alter table public.integration_providers enable row level security;

create policy integration_providers_select on public.integration_providers
  for select to authenticated using (true);

-- Credentials are sensitive: unlike every other table in this schema, there
-- is deliberately NO select policy here at all (default-deny, same pattern
-- as platform_staff) — the only way to learn about a connection, even a
-- masked view of it, is through list_integration_connections() below.
create table if not exists public.org_integration_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider_key text not null references public.integration_providers(key) on delete restrict,
  account_label text not null,
  credentials jsonb not null default '{}'::jsonb,
  is_connected boolean not null default true,
  connected_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider_key)
);

create index if not exists org_integration_connections_org_id_idx on public.org_integration_connections (org_id);

alter table public.org_integration_connections enable row level security;

create trigger set_org_integration_connections_updated_at
  before update on public.org_integration_connections
  for each row execute function public.set_updated_at();

-- Deliberately NOT the generic audit_trigger_with_module: it logs
-- to_jsonb(OLD)/to_jsonb(NEW) verbatim, which would put raw API keys into
-- audit_logs — readable by anyone with audit.view, a different (broader)
-- permission than integrations.manage. The RPCs below log a redacted entry
-- (provider + account label only) directly via insert_audit_log() instead.

create or replace function public.list_integration_connections(p_org_id uuid)
returns table (provider_key text, account_label text, is_connected boolean, connected_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;

  return query
  select c.provider_key, c.account_label, c.is_connected, c.created_at
  from public.org_integration_connections c
  where c.org_id = p_org_id;
end;
$$;

create or replace function public.connect_integration(p_org_id uuid, p_provider_key text, p_account_label text, p_credentials jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_connection_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'integrations.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.org_integration_connections (org_id, provider_key, account_label, credentials, is_connected)
  values (p_org_id, p_provider_key, p_account_label, p_credentials, true)
  on conflict (org_id, provider_key)
  do update set account_label = excluded.account_label, credentials = excluded.credentials, is_connected = true, updated_at = now()
  returning id into v_connection_id;

  perform public.insert_audit_log(
    p_org_id, 'integrations', 'org_integration_connections', v_connection_id, 'connect',
    null, jsonb_build_object('provider_key', p_provider_key, 'account_label', p_account_label)
  );
end;
$$;

create or replace function public.disconnect_integration(p_org_id uuid, p_provider_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'integrations.manage') then
    raise exception 'insufficient permissions';
  end if;

  delete from public.org_integration_connections where org_id = p_org_id and provider_key = p_provider_key;

  perform public.insert_audit_log(
    p_org_id, 'integrations', 'org_integration_connections', p_org_id, 'disconnect',
    jsonb_build_object('provider_key', p_provider_key), null
  );
end;
$$;
