-- In-app notifications (spec §15). Only the in-app channel ships this pass;
-- email/SMS/WhatsApp channels are future integration-hub work.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
