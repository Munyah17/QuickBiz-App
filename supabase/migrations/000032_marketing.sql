-- Marketing module: campaign tracking + a real loyalty points ledger.
-- No SMS/email/WhatsApp gateway is wired up (spec's own "no fake
-- functionality" rule) — campaigns are a real record of outreach the org
-- carried out through its own channels, not something QuickBiz sends on
-- their behalf. Loyalty points are fully functional: a real ledger against
-- the canonical Customer entity, no external integration required.

insert into public.permissions (key, label, category) values
  ('marketing.manage', 'Manage campaigns and loyalty points', 'sales')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'marketing.manage'
on conflict do nothing;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  channel text not null default 'other' check (channel in ('sms', 'email', 'whatsapp', 'social', 'other')),
  message text not null,
  target_segment text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_org_id_idx on public.campaigns (org_id);

alter table public.campaigns enable row level security;

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create policy campaigns_select on public.campaigns
  for select using (org_id in (select public.user_org_ids()));

create policy campaigns_write on public.campaigns
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'marketing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'marketing.manage'));

create trigger audit_campaigns
  after insert or update or delete on public.campaigns
  for each row execute function public.audit_trigger_with_module('marketing');

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  points integer not null check (points <> 0),
  type text not null check (type in ('earn', 'redeem', 'adjustment')),
  reason text,
  recorded_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_org_id_idx on public.loyalty_transactions (org_id);
create index if not exists loyalty_transactions_customer_id_idx on public.loyalty_transactions (customer_id);

alter table public.loyalty_transactions enable row level security;

create policy loyalty_transactions_select on public.loyalty_transactions
  for select using (org_id in (select public.user_org_ids()));

create policy loyalty_transactions_write on public.loyalty_transactions
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'marketing.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'marketing.manage'));

create trigger audit_loyalty_transactions
  after insert or update or delete on public.loyalty_transactions
  for each row execute function public.audit_trigger_with_module('marketing');
