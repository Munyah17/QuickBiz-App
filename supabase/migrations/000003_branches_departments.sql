-- Branches and departments. RLS policies added in 000004 alongside org_members.
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  type text not null default 'branch' check (type in ('head_office', 'branch', 'warehouse')),
  address jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create index if not exists branches_org_id_idx on public.branches (org_id);

alter table public.branches enable row level security;

create trigger set_branches_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_org_id_idx on public.departments (org_id);
create index if not exists departments_branch_id_idx on public.departments (branch_id);

alter table public.departments enable row level security;

create trigger set_departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();
