-- Simple key/value store for org-level configuration, avoiding an ever-growing
-- column list on organizations for every future setting.
create table if not exists public.org_settings (
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (org_id, key)
);

alter table public.org_settings enable row level security;

create trigger set_org_settings_updated_at
  before update on public.org_settings
  for each row execute function public.set_updated_at();

create policy org_settings_select on public.org_settings
  for select using (org_id in (select public.user_org_ids()));

create policy org_settings_write on public.org_settings
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'settings.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'settings.manage'));
