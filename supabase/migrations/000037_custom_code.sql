-- Custom Code module: org-level custom CSS and HTML, versioned with
-- rollback. Deliberately scoped to CSS/HTML only this pass (JS and
-- PHP/Python are visibly "planned", never faked) — arbitrary JS in an
-- authenticated session can read the acting user's own data/session, and
-- PHP/Python execution needs a genuinely sandboxed runtime (isolated
-- containers, resource limits) this stack does not have; building either
-- without that would be a real security hole or fake functionality.
-- Custom CSS is safe to apply directly (can't execute code or read data).
-- Custom HTML is rendered by the app in a script-less sandboxed iframe
-- (no `allow-scripts`, no `allow-same-origin`) so even a pasted <script>
-- tag genuinely cannot run or touch the parent session — see
-- CustomHtmlPreview.tsx.

insert into public.permissions (key, label, category) values
  ('custom_code.manage', 'Manage custom CSS and HTML', 'platform')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('owner', 'director')
  and p.key = 'custom_code.manage'
on conflict do nothing;

create table if not exists public.custom_code (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code_type text not null check (code_type in ('css', 'html')),
  content text not null default '',
  version integer not null default 1,
  is_active boolean not null default true,
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (org_id, code_type)
);

create index if not exists custom_code_org_id_idx on public.custom_code (org_id);

alter table public.custom_code enable row level security;

create policy custom_code_select on public.custom_code
  for select using (org_id in (select public.user_org_ids()));

create policy custom_code_write on public.custom_code
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'custom_code.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'custom_code.manage'));

create table if not exists public.custom_code_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code_type text not null check (code_type in ('css', 'html')),
  version integer not null,
  content text not null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code_type, version)
);

create index if not exists custom_code_versions_org_id_idx on public.custom_code_versions (org_id, code_type);

alter table public.custom_code_versions enable row level security;

create policy custom_code_versions_select on public.custom_code_versions
  for select using (org_id in (select public.user_org_ids()));

-- No write policy: only save_custom_code()/rollback_custom_code() insert
-- into version history, so it can never drift from what custom_code
-- actually holds at each version.

create or replace function public.save_custom_code(p_org_id uuid, p_code_type text, p_content text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_version integer;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'custom_code.manage') then
    raise exception 'insufficient permissions';
  end if;
  if p_code_type not in ('css', 'html') then
    raise exception 'unsupported code type';
  end if;

  select coalesce(max(version), 0) + 1 into v_next_version
  from public.custom_code_versions
  where org_id = p_org_id and code_type = p_code_type;

  insert into public.custom_code_versions (org_id, code_type, version, content)
  values (p_org_id, p_code_type, v_next_version, p_content);

  insert into public.custom_code (org_id, code_type, content, version, updated_by)
  values (p_org_id, p_code_type, p_content, v_next_version, auth.uid())
  on conflict (org_id, code_type)
  do update set content = excluded.content, version = excluded.version, updated_by = auth.uid(), updated_at = now();

  perform public.insert_audit_log(
    p_org_id, 'custom_code', 'custom_code', p_org_id, 'save',
    null, jsonb_build_object('code_type', p_code_type, 'version', v_next_version)
  );

  return v_next_version;
end;
$$;

create or replace function public.rollback_custom_code(p_org_id uuid, p_code_type text, p_target_version integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_content text;
  v_next_version integer;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'custom_code.manage') then
    raise exception 'insufficient permissions';
  end if;

  select content into v_target_content
  from public.custom_code_versions
  where org_id = p_org_id and code_type = p_code_type and version = p_target_version;

  if v_target_content is null then
    raise exception 'version not found';
  end if;

  select coalesce(max(version), 0) + 1 into v_next_version
  from public.custom_code_versions
  where org_id = p_org_id and code_type = p_code_type;

  insert into public.custom_code_versions (org_id, code_type, version, content)
  values (p_org_id, p_code_type, v_next_version, v_target_content);

  update public.custom_code
  set content = v_target_content, version = v_next_version, updated_by = auth.uid(), updated_at = now()
  where org_id = p_org_id and code_type = p_code_type;

  perform public.insert_audit_log(
    p_org_id, 'custom_code', 'custom_code', p_org_id, 'rollback',
    null, jsonb_build_object('code_type', p_code_type, 'rolled_back_to', p_target_version, 'new_version', v_next_version)
  );

  return v_next_version;
end;
$$;

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('custom_code', 'Custom Code', 'Custom CSS and HTML for your workspace, versioned with rollback', 'platform', 10)
on conflict (key) do nothing;
