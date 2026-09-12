-- Social Media Posting Module: compose and schedule posts across platforms
-- from one place. Real, useful on its own with zero external integration:
-- draft/caption/hashtag/media/platform-targeting management. Actually
-- PUBLISHING to a platform needs that platform's own OAuth app review
-- (Meta, TikTok, LinkedIn, X all require this - it cannot be completed
-- inside a build session), so this migration does not pretend a post gets
-- sent: queueing creates 'pending' per-platform records, and nothing here
-- ever marks a post 'published' - that only happens once a real
-- per-platform integration exists to report a genuine send result, which
-- is future work, not faked here.

insert into public.module_catalog (key, name, description, category, monthly_price_usd) values
  ('social_media', 'Social Media Management', 'Draft, schedule, and organize posts across multiple social media platforms from your dashboard - titles, captions, hashtags, and media in one place, auto-formatted per platform''s limits.', 'marketing', 20)
on conflict (key) do nothing;

insert into public.permissions (key, label, category) values
  ('social_media.manage', 'Create and manage social media posts and connections', 'marketing'),
  ('social_media.view', 'View social media posts', 'marketing')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager', 'team_leader')
  and p.key in ('social_media.manage', 'social_media.view')
on conflict do nothing;

-- Platform catalog - global reference data, not org-scoped.
create table if not exists public.social_platforms (
  key text primary key,
  name text not null,
  api_endpoint text,
  character_limit int,
  supports_images boolean not null default true,
  supports_videos boolean not null default false,
  image_aspect_ratio text
);

insert into public.social_platforms (key, name, api_endpoint, character_limit, supports_images, supports_videos, image_aspect_ratio) values
  ('facebook', 'Facebook', 'https://graph.facebook.com/v18.0', 63206, true, true, '1:1, 16:9, 4:5'),
  ('twitter', 'Twitter/X', 'https://api.twitter.com/2', 280, true, true, '16:9, 1:1'),
  ('linkedin', 'LinkedIn', 'https://api.linkedin.com/v2', 3000, true, true, '1:1, 4:5'),
  ('instagram', 'Instagram', 'https://graph.instagram.com', 2200, true, true, '1:1, 4:5, 16:9'),
  ('tiktok', 'TikTok', 'https://open.tiktokapis.com/v2', 150, true, true, '9:16')
on conflict (key) do nothing;

alter table public.social_platforms enable row level security;

create policy social_platforms_select on public.social_platforms
  for select to authenticated using (true);

-- Org social account connections hold live OAuth tokens once a real
-- integration exists to populate them - the same class of secret as
-- org_integration_connections (000035), so it gets the same treatment: NO
-- general select policy at all (RLS is row-level, not column-level, so a
-- narrower app query wouldn't actually protect the token column from a
-- direct query). Reads only via list_connected_social_accounts() below,
-- which returns non-secret fields only.
create table if not exists public.org_social_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  platform_key text not null references public.social_platforms(key) on delete restrict,
  account_id text not null,
  account_name text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  connected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, platform_key, account_id)
);

create index if not exists org_social_accounts_org_id_idx on public.org_social_accounts (org_id);
create index if not exists org_social_accounts_platform_key_idx on public.org_social_accounts (platform_key);

alter table public.org_social_accounts enable row level security;

create trigger set_org_social_accounts_updated_at
  before update on public.org_social_accounts
  for each row execute function public.set_updated_at();

-- Social media posts (drafts/schedule) - not secret, normal org-read.
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  content text not null,
  caption text,
  hashtags text[],
  media_urls jsonb default '[]'::jsonb,
  platform_specific_content jsonb default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'queued', 'published', 'failed')),
  scheduled_for timestamptz,
  published_at timestamptz,
  platforms jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_org_id_idx on public.social_posts (org_id);
create index if not exists social_posts_status_idx on public.social_posts (status);
create index if not exists social_posts_scheduled_for_idx on public.social_posts (scheduled_for);

alter table public.social_posts enable row level security;

create policy social_posts_select on public.social_posts
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

create policy social_posts_write on public.social_posts
  for all to authenticated
  using (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'social_media.manage'))
  with check (org_id in (select public.user_org_ids()) and public.has_permission(org_id, 'social_media.manage'));

create trigger set_social_posts_updated_at
  before update on public.social_posts
  for each row execute function public.set_updated_at();

-- Post publication results (per platform) - status stays 'pending' forever
-- until a real per-platform integration exists to report a genuine result.
create table if not exists public.social_post_publications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  platform_key text not null references public.social_platforms(key) on delete restrict,
  social_account_id uuid references public.org_social_accounts(id) on delete set null,
  platform_post_id text,
  status text not null check (status in ('pending', 'published', 'failed')),
  error_message text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists social_post_publications_post_id_idx on public.social_post_publications (post_id);
create index if not exists social_post_publications_org_id_idx on public.social_post_publications (org_id);

alter table public.social_post_publications enable row level security;

create policy social_post_publications_select on public.social_post_publications
  for select to authenticated
  using (org_id in (select public.user_org_ids()));

-- RPC functions

create or replace function public.connect_social_account(p_org_id uuid, p_platform_key text, p_account_id text, p_account_name text, p_access_token_encrypted text, p_refresh_token_encrypted text default null, p_token_expires_at timestamptz default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_connection_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'social_media.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.org_social_accounts (org_id, platform_key, account_id, account_name, access_token_encrypted, refresh_token_encrypted, token_expires_at, connected_by)
  values (p_org_id, p_platform_key, p_account_id, p_account_name, p_access_token_encrypted, p_refresh_token_encrypted, p_token_expires_at, auth.uid())
  on conflict (org_id, platform_key, account_id)
  do update set
    access_token_encrypted = excluded.access_token_encrypted,
    refresh_token_encrypted = excluded.refresh_token_encrypted,
    token_expires_at = excluded.token_expires_at,
    is_active = true,
    updated_at = now()
  returning id into v_connection_id;

  return v_connection_id;
end;
$$;

create or replace function public.disconnect_social_account(p_org_id uuid, p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'social_media.manage') then
    raise exception 'insufficient permissions';
  end if;

  delete from public.org_social_accounts where id = p_account_id and org_id = p_org_id;
end;
$$;

-- Masked read: only non-secret fields ever leave this table, matching
-- list_integration_connections() in 000035.
create or replace function public.list_connected_social_accounts(p_org_id uuid)
returns table (id uuid, platform_key text, account_name text, is_active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'social_media.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select a.id, a.platform_key, a.account_name, a.is_active, a.created_at
  from public.org_social_accounts a
  where a.org_id = p_org_id;
end;
$$;

create or replace function public.create_social_post(p_org_id uuid, p_title text, p_content text, p_caption text default null, p_hashtags text[] default null, p_media_urls jsonb default '[]'::jsonb, p_platforms jsonb default '[]'::jsonb, p_scheduled_for timestamptz default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'social_media.manage') then
    raise exception 'insufficient permissions';
  end if;

  insert into public.social_posts (org_id, title, content, caption, hashtags, media_urls, platforms, scheduled_for, status, created_by)
  values (p_org_id, p_title, p_content, p_caption, p_hashtags, p_media_urls, p_platforms, p_scheduled_for,
    case when p_scheduled_for is not null then 'scheduled' else 'draft' end,
    auth.uid())
  returning id into v_post_id;

  return v_post_id;
end;
$$;

create or replace function public.list_social_posts(p_org_id uuid, p_status text default null, p_limit int default 50)
returns table (
  id uuid,
  title text,
  status text,
  scheduled_for timestamptz,
  platforms jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(p_org_id, 'social_media.view') then
    raise exception 'insufficient permissions';
  end if;

  return query
  select id, title, status, scheduled_for, platforms, created_at
  from public.social_posts
  where org_id = p_org_id
    and (p_status is null or status = p_status)
  order by created_at desc
  limit p_limit;
end;
$$;

-- Queues a post for sending: creates a 'pending' publication row per
-- targeted platform and marks the post 'queued'. Deliberately does NOT set
-- status to 'published' - no code anywhere in this app actually calls a
-- social platform's API yet, so nothing here has genuinely been published.
-- A future real integration is what would update social_post_publications
-- rows to 'published'/'failed' and, only then, the post itself.
create or replace function public.queue_social_post_for_publishing(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_platforms jsonb;
  v_platform_key text;
begin
  select org_id, platforms into v_org_id, v_platforms from public.social_posts where id = p_post_id;

  if v_org_id is null then
    raise exception 'Post not found';
  end if;

  if v_org_id not in (select public.user_org_ids()) then
    raise exception 'not a member of this organization';
  end if;
  if not public.has_permission(v_org_id, 'social_media.manage') then
    raise exception 'insufficient permissions';
  end if;

  update public.social_posts
  set status = 'queued'
  where id = p_post_id;

  for v_platform_key in select jsonb_array_elements_text(v_platforms) loop
    insert into public.social_post_publications (post_id, org_id, platform_key, status)
    values (p_post_id, v_org_id, v_platform_key, 'pending');
  end loop;
end;
$$;
