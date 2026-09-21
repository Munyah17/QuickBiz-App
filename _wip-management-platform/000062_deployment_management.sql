-- Deployment Management Enhancement
-- Adds tables for deployment updates and health metrics

-- Deployment updates tracking
create table if not exists public.deployment_updates (
  id uuid primary key default gen_random_uuid(),
  deployment_id uuid not null references public.deployments(id) on delete cascade,
  current_version text not null,
  target_version text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  logs text default '',
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deployment_updates_deployment_idx on public.deployment_updates (deployment_id);
create index if not exists deployment_updates_status_idx on public.deployment_updates (status);

alter table public.deployment_updates enable row level security;

-- Platform users can view all deployment updates
create policy deployment_updates_platform_select on public.deployment_updates
  for select to authenticated
  using (exists (
    select 1 from public.platform_users
    where platform_users.user_id = auth.uid()
  ));

-- Deployment health metrics
create table if not exists public.deployment_health_metrics (
  id uuid primary key default gen_random_uuid(),
  deployment_id uuid not null references public.deployments(id) on delete cascade,
  cpu_usage numeric(5, 2) check (cpu_usage >= 0 and cpu_usage <= 100),
  memory_usage numeric(5, 2) check (memory_usage >= 0 and memory_usage <= 100),
  disk_usage numeric(5, 2) check (disk_usage >= 0 and disk_usage <= 100),
  response_time integer, -- in milliseconds
  active_connections integer default 0,
  recorded_at timestamptz not null default now()
);

create index if not exists deployment_health_metrics_deployment_idx on public.deployment_health_metrics (deployment_id);
create index if not exists deployment_health_metrics_recorded_at_idx on public.deployment_health_metrics (recorded_at desc);

alter table public.deployment_health_metrics enable row level security;

-- Platform users can view all health metrics
create policy deployment_health_metrics_platform_select on public.deployment_health_metrics
  for select to authenticated
  using (exists (
    select 1 from public.platform_users
    where platform_users.user_id = auth.uid()
  ));

-- Instances can insert their own health metrics
create policy deployment_health_metrics_instance_insert on public.deployment_health_metrics
  for insert to authenticated
  with check (exists (
    select 1 from public.deployments
    where deployments.id = deployment_health_metrics.deployment_id
      and deployments.api_key = (
        select management_api_key 
        from public.organizations 
        where id = deployments.client_id
      )
  ));

-- Add last_heartbeat_at to deployments table
alter table public.deployments
  add column if not exists last_heartbeat_at timestamptz;

-- Add version to deployments table
alter table public.deployments
  add column if not exists version text default '1.0.0';

-- Trigger for updated_at
create trigger set_deployment_updates_updated_at
  before update on public.deployment_updates
  for each row execute function public.set_updated_at();

-- RPC Functions

-- Check for available updates for a deployment
create or replace function public.check_deployment_updates(p_deployment_id uuid)
returns table (
  current_version text,
  latest_version text,
  update_available text,
  release_notes text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_version text;
  v_latest_version text;
  v_release_notes text;
begin
  -- Get current version
  select version into v_current_version
  from public.deployments
  where id = p_deployment_id;

  -- Get latest version from system settings
  select value into v_latest_version
  from public.system_settings
  where key = 'latest_version';

  -- Get release notes
  select value into v_release_notes
  from public.system_settings
  where key = 'release_notes';

  return query
  select 
    v_current_version,
    coalesce(v_latest_version, v_current_version) as latest_version,
    case 
      when v_current_version <> coalesce(v_latest_version, v_current_version) 
      then coalesce(v_latest_version, v_current_version)
      else null
    end as update_available,
    v_release_notes;
end;
$$;

-- Request deployment update
create or replace function public.request_deployment_update(p_deployment_id uuid, p_target_version text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_version text;
  v_update_id uuid;
begin
  -- Get current version
  select version into v_current_version
  from public.deployments
  where id = p_deployment_id;

  if v_current_version is null then
    raise exception 'Deployment not found';
  end if;

  -- Create update request
  insert into public.deployment_updates (deployment_id, current_version, target_version, status)
  values (p_deployment_id, v_current_version, p_target_version, 'scheduled')
  returning id into v_update_id;

  return v_update_id;
end;
$$;

-- Update deployment update progress
create or replace function public.update_deployment_progress(p_update_id uuid, p_progress integer, p_status text, p_logs text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deployment_id uuid;
  v_target_version text;
  v_update deployment_updates%rowtype;
begin
  -- Get update record
  select * into v_update
  from public.deployment_updates
  where id = p_update_id;

  if v_update is null then
    raise exception 'Update request not found';
  end if;

  v_deployment_id := v_update.deployment_id;
  v_target_version := v_update.target_version;

  -- Update progress
  update public.deployment_updates
  set 
    progress = p_progress,
    status = p_status,
    logs = coalesce(p_logs, logs),
    updated_at = now()
  where id = p_update_id;

  -- Handle status changes
  if p_status = 'in_progress' and v_update.started_at is null then
    update public.deployment_updates
    set started_at = now()
    where id = p_update_id;
  elsif p_status = 'completed' and v_update.completed_at is null then
    update public.deployment_updates
    set completed_at = now()
    where id = p_update_id;

    -- Update deployment version
    update public.deployments
    set version = v_target_version
    where id = v_deployment_id;
  elsif p_status = 'failed' and v_update.failed_at is null then
    update public.deployment_updates
    set failed_at = now()
    where id = p_update_id;
  end if;
end;
$$;

-- Record deployment health metrics
create or replace function public.record_health_metrics(
  p_deployment_id uuid,
  p_cpu_usage numeric,
  p_memory_usage numeric,
  p_disk_usage numeric,
  p_response_time integer,
  p_active_connections integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deployment_health_metrics (
    deployment_id,
    cpu_usage,
    memory_usage,
    disk_usage,
    response_time,
    active_connections
  )
  values (
    p_deployment_id,
    p_cpu_usage,
    p_memory_usage,
    p_disk_usage,
    p_response_time,
    p_active_connections
  );
end;
$$;

-- Get deployment health status
create or replace function public.get_deployment_health(p_deployment_id uuid)
returns table (
  health_score integer,
  health_status text,
  last_heartbeat timestamptz,
  last_metrics jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_health_score integer := 100;
  v_last_heartbeat timestamptz;
  v_last_metrics jsonb;
  v_issues text[] := array[]::text[];
begin
  -- Get deployment info
  select last_heartbeat_at into v_last_heartbeat
  from public.deployments
  where id = p_deployment_id;

  -- Get latest metrics
  select row_to_json(dm) into v_last_metrics
  from public.deployment_health_metrics dm
  where dm.deployment_id = p_deployment_id
  order by dm.recorded_at desc
  limit 1;

  -- Calculate health score based on metrics
  if v_last_metrics is not null then
    if (v_last_metrics->>'cpu_usage')::numeric > 80 then
      v_health_score := v_health_score - 20;
      v_issues := array_append(v_issues, 'High CPU usage');
    end if;
    if (v_last_metrics->>'memory_usage')::numeric > 80 then
      v_health_score := v_health_score - 20;
      v_issues := array_append(v_issues, 'High memory usage');
    end if;
    if (v_last_metrics->>'disk_usage')::numeric > 80 then
      v_health_score := v_health_score - 15;
      v_issues := array_append(v_issues, 'High disk usage');
    end if;
    if (v_last_metrics->>'response_time')::integer > 2000 then
      v_health_score := v_health_score - 15;
      v_issues := array_append(v_issues, 'Slow response time');
    end if;
  end if;

  -- Check heartbeat age
  if v_last_heartbeat is not null then
    if (extract(epoch from now()) - extract(epoch from v_last_heartbeat)) > 300 then -- 5 minutes
      v_health_score := v_health_score - 30;
      v_issues := array_append(v_issues, 'Stale heartbeat');
    end if;
  else
    v_health_score := v_health_score - 50;
    v_issues := array_append(v_issues, 'No heartbeat recorded');
  end if;

  -- Ensure score is not negative
  v_health_score := greatest(0, v_health_score);

  -- Determine health status
  return query
  select 
    v_health_score,
    case 
      when v_health_score >= 80 then 'healthy'
      when v_health_score >= 50 then 'warning'
      else 'critical'
    end as health_status,
    v_last_heartbeat,
    v_last_metrics;
end;
$$;

-- Get deployment update history
create or replace function public.get_deployment_updates(p_deployment_id uuid)
returns table (
  id uuid,
  current_version text,
  target_version text,
  status text,
  progress integer,
  requested_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    id, current_version, target_version, status, progress, requested_at, completed_at
  from public.deployment_updates
  where deployment_id = p_deployment_id
  order by requested_at desc;
end;
$$;
