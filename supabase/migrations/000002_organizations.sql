-- Tenants. RLS policies for this table are added in 000004, once org_members
-- (and the user_org_ids() helper it depends on) exists — a org's own
-- membership table is what determines who can see the org.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  currency text not null default 'USD',
  timezone text not null default 'Africa/Harare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();
