-- Metadata-driven custom fields (spec §13). Schema only in this foundation
-- pass — no physical columns are added per customer, and no admin UI ships
-- yet, but establishing the shape now means future modules (and their
-- entity_type values) don't force a breaking migration later.
create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  key text not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'number', 'boolean', 'date', 'select')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, entity_type, key)
);

create index if not exists custom_field_definitions_org_entity_idx
  on public.custom_field_definitions (org_id, entity_type);

alter table public.custom_field_definitions enable row level security;

create policy custom_field_definitions_select on public.custom_field_definitions
  for select using (org_id in (select public.user_org_ids()));

create policy custom_field_definitions_write on public.custom_field_definitions
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'settings.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'settings.manage'));

create table if not exists public.custom_field_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_id uuid not null references public.custom_field_definitions(id) on delete cascade,
  value jsonb not null default 'null'::jsonb,
  unique (entity_id, field_id)
);

create index if not exists custom_field_values_entity_idx
  on public.custom_field_values (org_id, entity_type, entity_id);

alter table public.custom_field_values enable row level security;

create policy custom_field_values_select on public.custom_field_values
  for select using (org_id in (select public.user_org_ids()));

create policy custom_field_values_write on public.custom_field_values
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
