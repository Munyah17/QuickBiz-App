-- Audit trail (spec §16). Rows are only ever written by SECURITY DEFINER
-- trigger functions, never by direct client insert, so ordinary users cannot
-- tamper with their own history.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- References public.profiles rather than auth.users so PostgREST can embed
  -- profiles(full_name) directly (see the same note on org_members.user_id
  -- in 000004_profiles_members.sql).
  actor_id uuid references public.profiles(id) on delete set null,
  module text not null default 'core',
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_org_id_created_at_idx
  on public.audit_logs (org_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs
  for select using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'audit.view'));

create or replace function public.insert_audit_log(
  p_org_id uuid,
  p_module text,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_old jsonb,
  p_new jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (org_id, actor_id, module, entity_type, entity_id, action, old_value, new_value)
  values (p_org_id, auth.uid(), p_module, p_entity_type, p_entity_id, p_action, p_old, p_new);
$$;

-- Generic trigger for any table shaped with an `id` primary key and an
-- `org_id` column (organizations, branches, org_modules, ...).
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_entity_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_org_id := (to_jsonb(OLD) ->> 'org_id')::uuid;
    if v_org_id is null and TG_TABLE_NAME = 'organizations' then
      v_org_id := OLD.id;
    end if;
    v_entity_id := OLD.id;
  else
    v_org_id := (to_jsonb(NEW) ->> 'org_id')::uuid;
    if v_org_id is null and TG_TABLE_NAME = 'organizations' then
      v_org_id := NEW.id;
    end if;
    v_entity_id := NEW.id;
  end if;

  perform public.insert_audit_log(
    v_org_id,
    'core',
    TG_TABLE_NAME,
    v_entity_id,
    lower(TG_OP),
    case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end
  );

  return coalesce(NEW, OLD);
end;
$$;

create trigger audit_organizations
  after insert or update or delete on public.organizations
  for each row execute function public.audit_trigger();

create trigger audit_branches
  after insert or update or delete on public.branches
  for each row execute function public.audit_trigger();

create trigger audit_org_modules
  after insert or update or delete on public.org_modules
  for each row execute function public.audit_trigger();

-- user_roles has a composite key and no org_id column, so it needs a
-- dedicated trigger that resolves the org via org_members.
create or replace function public.audit_user_roles_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_member_id uuid;
begin
  v_member_id := coalesce(NEW.org_member_id, OLD.org_member_id);
  select org_id into v_org_id from public.org_members where id = v_member_id;

  perform public.insert_audit_log(
    v_org_id,
    'core',
    'user_roles',
    v_member_id,
    lower(TG_OP),
    case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end
  );

  return coalesce(NEW, OLD);
end;
$$;

create trigger audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.audit_user_roles_trigger();
