-- Documents module: a per-org document library backed by Supabase Storage.
-- documents.storage_path always starts with "<org_id>/" — that prefix is
-- what the storage.objects RLS policies below check, so app code must never
-- upload outside that convention.

insert into public.permissions (key, label, category) values
  ('documents.manage', 'Upload and manage documents', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'documents.manage'
on conflict do nothing;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  title text not null,
  category text not null default 'general',
  description text,
  file_name text not null,
  storage_path text not null,
  file_size bigint not null default 0,
  mime_type text,
  expiry_date date,
  uploaded_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_path)
);

create index if not exists documents_org_id_idx on public.documents (org_id);

alter table public.documents enable row level security;

create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create policy documents_select on public.documents
  for select using (org_id in (select public.user_org_ids()));

create policy documents_write on public.documents
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'documents.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'documents.manage'));

create trigger audit_documents
  after insert or update or delete on public.documents
  for each row execute function public.audit_trigger_with_module('documents');

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

create policy documents_storage_select on storage.objects
  for select to authenticated using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.user_org_ids())
  );

create policy documents_storage_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.user_org_ids())
    and public.has_permission((storage.foldername(name))[1]::uuid, 'documents.manage')
  );

create policy documents_storage_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.user_org_ids())
    and public.has_permission((storage.foldername(name))[1]::uuid, 'documents.manage')
  );
