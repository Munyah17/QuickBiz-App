-- Multi-currency support (spec: multi-currency platform, Zimbabwe-first).
-- Global reference table so the Company settings currency picker (and later
-- Finance-module exchange rates) has a real, extensible list instead of a
-- free-text field. organizations.currency now references this table.
create table if not exists public.currencies (
  code text primary key,
  name text not null,
  symbol text not null
);

insert into public.currencies (code, name, symbol) values
  ('USD', 'US Dollar', '$'),
  ('ZiG', 'Zimbabwe Gold', 'ZiG'),
  ('ZAR', 'South African Rand', 'R'),
  ('BWP', 'Botswana Pula', 'P'),
  ('ZMW', 'Zambian Kwacha', 'ZK'),
  ('KES', 'Kenyan Shilling', 'KSh'),
  ('GBP', 'British Pound', '£'),
  ('EUR', 'Euro', '€'),
  ('CAD', 'Canadian Dollar', 'CA$'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('NZD', 'New Zealand Dollar', 'NZ$'),
  ('SEK', 'Swedish Krona', 'kr'),
  ('CHF', 'Swiss Franc', 'CHF'),
  ('JPY', 'Japanese Yen', '¥'),
  ('CNY', 'Chinese Yuan', '¥'),
  ('INR', 'Indian Rupee', '₹'),
  ('NGN', 'Nigerian Naira', '₦'),
  ('GHS', 'Ghanaian Cedi', 'GH₵'),
  ('XOF', 'West African CFA Franc', 'CFA'),
  ('XAF', 'Central African CFA Franc', 'FCFA'),
  ('EGP', 'Egyptian Pound', 'E£'),
  ('DZD', 'Algerian Dinar', 'DA'),
  ('AED', 'UAE Dirham', 'AED'),
  ('SAR', 'Saudi Riyal', 'SAR'),
  ('TRY', 'Turkish Lira', '₺'),
  ('BRL', 'Brazilian Real', 'R$'),
  ('MXN', 'Mexican Peso', 'MX$'),
  ('MWK', 'Malawian Kwacha', 'MK'),
  ('ETB', 'Ethiopian Birr', 'Br'),
  ('CDF', 'Congolese Franc', 'FC'),
  ('TZS', 'Tanzanian Shilling', 'TSh')
on conflict (code) do nothing;

alter table public.currencies enable row level security;

create policy currencies_select on public.currencies
  for select to authenticated using (true);

-- Backfill any legacy 'ZWL' rows before tightening the foreign key.
update public.organizations set currency = 'USD' where currency = 'ZWL';

alter table public.organizations
  add constraint organizations_currency_fkey foreign key (currency) references public.currencies(code);
