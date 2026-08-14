-- Reusable document-numbering primitive. No UI this pass — future modules
-- (invoices, purchase orders, ...) call next_number() instead of each
-- inventing its own numbering scheme.
create table if not exists public.numbering_sequences (
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  prefix text not null default '',
  next_number integer not null default 1,
  primary key (org_id, entity_type)
);

alter table public.numbering_sequences enable row level security;

create policy numbering_sequences_select on public.numbering_sequences
  for select using (org_id in (select public.user_org_ids()));

create policy numbering_sequences_write on public.numbering_sequences
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'settings.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'settings.manage'));

-- Atomically reserves and returns the next formatted number, e.g. 'INV-000042'.
create or replace function public.next_number(target_org_id uuid, p_entity_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_number integer;
begin
  insert into public.numbering_sequences (org_id, entity_type, prefix, next_number)
  values (target_org_id, p_entity_type, '', 1)
  on conflict (org_id, entity_type) do nothing;

  update public.numbering_sequences
  set next_number = next_number + 1
  where org_id = target_org_id and entity_type = p_entity_type
  returning prefix, next_number - 1 into v_prefix, v_number;

  return v_prefix || lpad(v_number::text, 6, '0');
end;
$$;
