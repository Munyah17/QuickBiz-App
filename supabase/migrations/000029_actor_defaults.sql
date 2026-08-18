-- Fixes a real gap found while building the Service Management module:
-- expenses.created_by, leads.created_by, opportunities.created_by,
-- projects.created_by, and asset_maintenance.performed_by were only ever
-- populated by SECURITY DEFINER RPCs explicitly setting auth.uid() — but
-- these five are written by direct client inserts (no RPC), and no
-- services/*.ts function was setting the actor field, so every row so far
-- has a silently null "who did this." Not a security issue (RLS never
-- depended on these), but a real attribution gap. Fixing at the column
-- default rather than trusting every future insert call site to remember.
alter table public.expenses alter column created_by set default auth.uid();
alter table public.leads alter column created_by set default auth.uid();
alter table public.opportunities alter column created_by set default auth.uid();
alter table public.projects alter column created_by set default auth.uid();
alter table public.asset_maintenance alter column performed_by set default auth.uid();
