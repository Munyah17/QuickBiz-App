-- Service Management module: support tickets with a comment thread. SLA
-- timers, service contracts, and warranty tracking (spec's fuller list) are
-- future work, not faked here.

insert into public.permissions (key, label, category) values
  ('service.manage', 'Manage service tickets', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'service.manage'
on conflict do nothing;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  ticket_number text not null,
  subject text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  -- default auth.uid(): direct client inserts (not a SECURITY DEFINER RPC)
  -- never remember to set this explicitly, so it must default at the schema
  -- level or it silently stays null forever (see 000029's fix for the same
  -- gap on earlier modules).
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (org_id, ticket_number)
);

create index if not exists tickets_org_id_idx on public.tickets (org_id);

alter table public.tickets enable row level security;

create trigger set_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create policy tickets_select on public.tickets
  for select using (org_id in (select public.user_org_ids()));

create policy tickets_write on public.tickets
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'service.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'service.manage'));

create trigger audit_tickets
  after insert or update or delete on public.tickets
  for each row execute function public.audit_trigger_with_module('service');

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_comments_ticket_id_idx on public.ticket_comments (ticket_id);

alter table public.ticket_comments enable row level security;

create policy ticket_comments_select on public.ticket_comments
  for select using (org_id in (select public.user_org_ids()));

create policy ticket_comments_write on public.ticket_comments
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'service.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'service.manage'));
