-- Projects module, scoped to projects + tasks (a real, working slice).
-- Milestones/timesheets/resource allocation/project profitability (spec's
-- fuller list) are future work, not faked here.

insert into public.permissions (key, label, category) values
  ('projects.manage', 'Manage projects and tasks', 'operations')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key = 'projects.manage'
on conflict do nothing;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  budget numeric(12, 2) not null default 0,
  start_date date,
  end_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_org_id_idx on public.projects (org_id);

alter table public.projects enable row level security;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create policy projects_select on public.projects
  for select using (org_id in (select public.user_org_ids()));

create policy projects_write on public.projects
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.manage'));

create trigger audit_projects
  after insert or update or delete on public.projects
  for each row execute function public.audit_trigger_with_module('projects');

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_tasks_project_id_idx on public.project_tasks (project_id);

alter table public.project_tasks enable row level security;

create trigger set_project_tasks_updated_at
  before update on public.project_tasks
  for each row execute function public.set_updated_at();

create policy project_tasks_select on public.project_tasks
  for select using (org_id in (select public.user_org_ids()));

create policy project_tasks_write on public.project_tasks
  for all using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'projects.manage'));
