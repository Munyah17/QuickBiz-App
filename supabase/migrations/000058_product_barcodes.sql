-- Product barcodes — lets the POS add items by scanning or typing a
-- barcode exactly, without relying on fuzzy name search.

alter table public.products
  add column if not exists barcode text;

create unique index if not exists products_org_barcode_key
  on public.products (org_id, barcode)
  where barcode is not null;
