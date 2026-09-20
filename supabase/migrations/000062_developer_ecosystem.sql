-- Developer ecosystem: third-party module marketplace, public/private API,
-- prepaid token wallet, and developer portal support.
--
-- Economics:
--   * Developers pay $5/month hosting per published module.
--   * QuickBiz keeps 30% of every module license fee; developer gets 70%.
--   * API usage is prepaid: $1 = 1000 tokens, deducted per request.
--   * QuickBiz reserves the right to approve, reject, suspend, or delete
--     any submitted module (status workflow below).

-- ---------------------------------------------------------------------------
-- developers — a developer account is an auth.users identity with a
-- developer profile. Developers are NOT org members; the portal is separate.
-- ---------------------------------------------------------------------------
create table if not exists public.developers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  company_name text,
  email text not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.developers enable row level security;

create policy developers_select_own on public.developers
  for select using (auth.uid() = user_id);
create policy developers_insert_own on public.developers
  for insert with check (auth.uid() = user_id);
create policy developers_update_own on public.developers
  for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- developer_wallets — prepaid token balance. $1 = 1000 tokens.
-- ---------------------------------------------------------------------------
create table if not exists public.developer_wallets (
  developer_id uuid primary key references public.developers(id) on delete cascade,
  token_balance bigint not null default 0 check (token_balance >= 0),
  lifetime_tokens_purchased bigint not null default 0,
  lifetime_tokens_used bigint not null default 0,
  -- Balance thresholds are measured against the most recent top-up so the
  -- "below 10%" warning scales with how much the developer buys.
  last_topup_tokens bigint not null default 0,
  low_balance_notified boolean not null default false,
  depleted_notified boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.developer_wallets enable row level security;

create policy wallets_select_own on public.developer_wallets
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- wallet_transactions — top-ups, usage debits, hosting fees, refunds.
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  type text not null check (type in ('topup', 'debit', 'hosting_fee', 'refund')),
  amount_usd numeric(10,2) not null default 0,
  tokens bigint not null default 0,
  method text check (method in ('paynow', 'ecocash', 'system')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  reference text,
  created_at timestamptz not null default now()
);

alter table public.wallet_transactions enable row level security;

create policy wallet_tx_select_own on public.wallet_transactions
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- api_keys — bearer keys. scope 'public' = module-integration keys (access
-- any org that licensed one of the developer's modules). scope 'private' =
-- B2B keys bound to a single org.
-- Keys are stored as SHA-256 hashes; the plaintext is shown once at creation.
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scope text not null check (scope in ('public', 'private')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy api_keys_select_own on public.api_keys
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );
create policy api_keys_insert_own on public.api_keys
  for insert with check (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );
create policy api_keys_update_own on public.api_keys
  for update using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- api_usage — per-request metering log.
-- ---------------------------------------------------------------------------
create table if not exists public.api_usage (
  id bigint generated always as identity primary key,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  developer_id uuid not null references public.developers(id) on delete cascade,
  endpoint text not null,
  method text not null,
  tokens_used integer not null,
  status_code integer not null,
  created_at timestamptz not null default now()
);

create index if not exists api_usage_developer_idx on public.api_usage (developer_id, created_at desc);
create index if not exists api_usage_key_idx on public.api_usage (api_key_id, created_at desc);

alter table public.api_usage enable row level security;

create policy api_usage_select_own on public.api_usage
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- module_submissions — a developer's module listing in the Module Store.
-- Status workflow: draft -> pending_review -> approved | rejected.
-- Approved modules can later be suspended or deleted by platform staff.
-- ---------------------------------------------------------------------------
create table if not exists public.module_submissions (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  module_key text not null,
  name text not null,
  description text not null,
  category text not null default 'other',
  version text not null default '1.0.0',
  -- manifest: entry URL, required API scopes, webhook endpoints, icon, etc.
  manifest jsonb not null default '{}'::jsonb,
  monthly_price_usd numeric(10,2) not null default 0 check (monthly_price_usd >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'suspended', 'deleted')),
  review_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (developer_id, module_key)
);

alter table public.module_submissions enable row level security;

create policy submissions_select_own on public.module_submissions
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );
create policy submissions_insert_own on public.module_submissions
  for insert with check (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );
create policy submissions_update_own on public.module_submissions
  for update using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- Orgs browsing the store can see approved modules.
create policy submissions_select_approved on public.module_submissions
  for select using (status = 'approved');

-- ---------------------------------------------------------------------------
-- module_licenses — an org's paid license to use a third-party module.
-- ---------------------------------------------------------------------------
create table if not exists public.module_licenses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.module_submissions(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  monthly_price_usd numeric(10,2) not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  activated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (submission_id, org_id)
);

alter table public.module_licenses enable row level security;

-- Org members see their own org's licenses; developers see licenses of their modules.
create policy licenses_select_org on public.module_licenses
  for select using (
    exists (
      select 1 from public.org_members m
      where m.org_id = module_licenses.org_id and m.user_id = auth.uid() and m.status = 'active'
    )
    or exists (
      select 1 from public.module_submissions s
      join public.developers d on d.id = s.developer_id
      where s.id = module_licenses.submission_id and d.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- developer_payouts — monthly settlement. Platform keeps 30%.
-- ---------------------------------------------------------------------------
create table if not exists public.developer_payouts (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  period text not null, -- e.g. '2026-09'
  gross_usd numeric(10,2) not null default 0,
  platform_share_usd numeric(10,2) not null default 0,
  net_usd numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  unique (developer_id, period)
);

alter table public.developer_payouts enable row level security;

create policy payouts_select_own on public.developer_payouts
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- developer_support_tickets — portal support channel.
-- ---------------------------------------------------------------------------
create table if not exists public.developer_support_tickets (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.developer_support_tickets enable row level security;

create policy dev_tickets_select_own on public.developer_support_tickets
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );
create policy dev_tickets_insert_own on public.developer_support_tickets
  for insert with check (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- RPCs — the API layer and portal call these. They run as security definer
-- so the service-role API path and the RLS-bound portal path share logic.
-- ---------------------------------------------------------------------------

-- Authenticate an API key by its SHA-256 hash. Returns the key row plus the
-- developer's status; callers enforce scope/org rules themselves.
create or replace function public.get_api_key_by_hash(p_key_hash text)
returns table (
  id uuid,
  developer_id uuid,
  org_id uuid,
  scope text,
  status text,
  developer_status text
)
language sql security definer stable
set search_path = public
as $$
  select k.id, k.developer_id, k.org_id, k.scope, k.status, d.status
  from public.api_keys k
  join public.developers d on d.id = k.developer_id
  where k.key_hash = p_key_hash;
$$;

-- Atomically debit tokens for an API call and log usage. Returns the new
-- balance, or -1 if the balance can't cover the cost (caller returns 402).
create or replace function public.charge_api_tokens(
  p_api_key_id uuid,
  p_developer_id uuid,
  p_endpoint text,
  p_method text,
  p_tokens integer,
  p_status_code integer
)
returns bigint
language plpgsql security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  update public.developer_wallets
     set token_balance = token_balance - p_tokens,
         lifetime_tokens_used = lifetime_tokens_used + p_tokens,
         updated_at = now()
   where developer_id = p_developer_id
     and token_balance >= p_tokens
  returning token_balance into v_balance;

  if v_balance is null then
    return -1;
  end if;

  insert into public.api_usage (api_key_id, developer_id, endpoint, method, tokens_used, status_code)
  values (p_api_key_id, p_developer_id, p_endpoint, p_method, p_tokens, p_status_code);

  update public.api_keys set last_used_at = now() where id = p_api_key_id;

  return v_balance;
end;
$$;

-- Credit a completed top-up: adds tokens, records the baseline for the 10%
-- low-balance warning, and clears notification flags.
create or replace function public.credit_wallet_topup(p_transaction_id uuid)
returns bigint
language plpgsql security definer
set search_path = public
as $$
declare
  v_tx public.wallet_transactions%rowtype;
  v_balance bigint;
begin
  select * into v_tx from public.wallet_transactions where id = p_transaction_id for update;
  if not found then
    raise exception 'transaction not found';
  end if;
  if v_tx.status = 'completed' then
    select token_balance into v_balance from public.developer_wallets where developer_id = v_tx.developer_id;
    return v_balance;
  end if;

  update public.wallet_transactions set status = 'completed' where id = p_transaction_id;

  insert into public.developer_wallets (developer_id, token_balance, lifetime_tokens_purchased, last_topup_tokens)
  values (v_tx.developer_id, v_tx.tokens, v_tx.tokens, v_tx.tokens)
  on conflict (developer_id) do update
    set token_balance = developer_wallets.token_balance + v_tx.tokens,
        lifetime_tokens_purchased = developer_wallets.lifetime_tokens_purchased + v_tx.tokens,
        last_topup_tokens = v_tx.tokens,
        low_balance_notified = false,
        depleted_notified = false,
        updated_at = now()
  returning token_balance into v_balance;

  return v_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- developer_notifications — low-balance warnings, review decisions, payout
-- notices. Separate from org notifications (which require org_id).
-- ---------------------------------------------------------------------------
create table if not exists public.developer_notifications (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dev_notifications_idx
  on public.developer_notifications (developer_id, created_at desc);

alter table public.developer_notifications enable row level security;

create policy dev_notifications_select_own on public.developer_notifications
  for select using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );
create policy dev_notifications_update_own on public.developer_notifications
  for update using (
    exists (select 1 from public.developers d where d.id = developer_id and d.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- api_webhooks — B2B webhook endpoints an org registers for event pushes.
-- ---------------------------------------------------------------------------
create table if not exists public.api_webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  url text not null,
  events text[] not null default '{}',
  secret text not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

alter table public.api_webhooks enable row level security;

-- ---------------------------------------------------------------------------
-- Low-balance alert check — called by the API layer after each charge.
-- Fires once per top-up cycle: at <10% of the last top-up, and at zero.
-- ---------------------------------------------------------------------------
create or replace function public.check_balance_alerts(p_developer_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  w public.developer_wallets%rowtype;
  v_threshold bigint;
begin
  select * into w from public.developer_wallets where developer_id = p_developer_id;
  if not found then return; end if;

  -- Depleted: balance hit zero.
  if w.token_balance <= 0 and not w.depleted_notified then
    insert into public.developer_notifications (developer_id, title, body, type)
    values (p_developer_id, 'API tokens depleted',
            'Your API token balance is empty. API calls will fail with 402 until you top up your wallet.',
            'error');
    update public.developer_wallets set depleted_notified = true where developer_id = p_developer_id;
    return;
  end if;

  -- Low: below 10% of the last top-up amount.
  v_threshold := greatest(floor(w.last_topup_tokens * 0.1), 10);
  if w.token_balance < v_threshold and not w.low_balance_notified then
    insert into public.developer_notifications (developer_id, title, body, type)
    values (p_developer_id, 'API token balance low',
            'Your balance has dropped below 10% of your last top-up (' || w.token_balance || ' tokens left). Top up soon to avoid interruption.',
            'warning');
    update public.developer_wallets set low_balance_notified = true where developer_id = p_developer_id;
  end if;
end;
$$;

-- Orgs a developer's public key may access: any org holding an active
-- license for one of that developer's approved modules.
create or replace function public.developer_licensed_orgs(p_developer_id uuid)
returns table (org_id uuid, org_name text, module_key text)
language sql security definer stable
set search_path = public
as $$
  select l.org_id, o.name, s.module_key
  from public.module_licenses l
  join public.module_submissions s on s.id = l.submission_id
  join public.organizations o on o.id = l.org_id
  where s.developer_id = p_developer_id
    and s.status = 'approved'
    and l.status = 'active';
$$;
