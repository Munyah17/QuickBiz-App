-- Per-tenant UI theming. QuickBiz is multi-vendor/multi-tenant and different
-- orgs want their own brand color driving both the sidebar and the primary
-- accent (buttons, active nav, links) — see spec §37 "design tokens must
-- remain centralized" and the UI/UX Configurations settings request. NULL
-- means "use the default QuickBiz navy/blue theme" from the reference design.
alter table public.organizations
  add column theme_color text
  check (theme_color is null or theme_color ~ '^#[0-9A-Fa-f]{6}$');
