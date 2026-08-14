-- Profiles (1:1 with auth.users) and org_members (the tenant-membership table
-- that all multi-tenant RLS in this platform is ultimately anchored to).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile row whenever Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- References public.profiles rather than auth.users so PostgREST can embed
  -- profiles(full_name) directly from org_members (it can only auto-detect
  -- relationships via real FKs within the exposed public schema). profiles.id
  -- always equals the corresponding auth.users.id (see profiles table above)
  -- and is guaranteed to exist first via the handle_new_user trigger.
  user_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_members_org_id_idx on public.org_members (org_id);
create index if not exists org_members_user_id_idx on public.org_members (user_id);

alter table public.org_members enable row level security;

create trigger set_org_members_updated_at
  before update on public.org_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tenant-isolation helpers. SECURITY DEFINER so they can read org_members
-- without recursively triggering org_members' own RLS policies.
-- ---------------------------------------------------------------------------

create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.org_members
  where user_id = auth.uid() and status = 'active';
$$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = target_org_id and user_id = auth.uid() and status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS policies for tables created in earlier migrations (000002, 000003),
-- deferred until user_org_ids() exists.
-- ---------------------------------------------------------------------------

create policy organizations_select on public.organizations
  for select using (id in (select public.user_org_ids()));

create policy organizations_update on public.organizations
  for update using (public.is_org_member(id))
  with check (public.is_org_member(id));

create policy branches_select on public.branches
  for select using (org_id in (select public.user_org_ids()));

create policy branches_write on public.branches
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy departments_select on public.departments
  for select using (org_id in (select public.user_org_ids()));

create policy departments_write on public.departments
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or id in (
      select user_id from public.org_members
      where org_id in (select public.user_org_ids())
    )
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy org_members_select on public.org_members
  for select using (org_id in (select public.user_org_ids()));

create policy org_members_update on public.org_members
  for update using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
