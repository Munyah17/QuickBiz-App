-- Bill of Materials, given real substance (explicit user feedback,
-- 2026-08-20: the creation modal and report had ~4 fields total, not
-- enough for a "proper organisation" to actually run production costing
-- on). Adds the fields a real manufacturing recipe needs: how many
-- finished units one batch of this recipe yields, per-line wastage/scrap
-- allowance, labor/overhead cost, and a revision marker - enough to
-- compute a real estimated cost per unit, not just a component list.

alter table public.bill_of_materials
  add column if not exists description text,
  add column if not exists revision text not null default 'A',
  add column if not exists yield_quantity numeric(12, 4) not null default 1 check (yield_quantity > 0),
  add column if not exists labor_cost numeric(12, 2) not null default 0,
  add column if not exists overhead_cost numeric(12, 2) not null default 0;

alter table public.bom_components
  add column if not exists wastage_percent numeric(5, 2) not null default 0 check (wastage_percent >= 0 and wastage_percent < 100),
  add column if not exists notes text;
