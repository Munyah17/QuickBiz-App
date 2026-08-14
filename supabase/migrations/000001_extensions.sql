-- Platform foundation: extensions and shared utility functions required by later migrations.
create extension if not exists "pgcrypto" with schema extensions;

-- Shared trigger function: keeps updated_at current on any table that attaches it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
