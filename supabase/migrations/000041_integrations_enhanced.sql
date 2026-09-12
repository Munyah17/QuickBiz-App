-- Adds ePay Smart (the user's own virtual card issuing platform - issues
-- cards, does not collect payments, so it's a distinct provider from "card
-- acquiring" above, not a replacement for it) and Ice Cash (ZINARA vehicle
-- licensing/road access fees, per user's own domain knowledge) to the Local
-- Services catalog. Does NOT re-touch the 'card' description - 000040
-- already fixed it against verified sources; re-asserting unverified bank
-- names (ZB, FBC) here would undo that care for no real gain.

insert into public.integration_providers (key, name, category, description, credential_fields) values
  ('epay_smart', 'ePay Smart', 'card', 'Virtual Mastercard and Visa card issuance platform. Issue virtual cards for online payments, subscriptions, and e-commerce spend (procurement, petty cash, staff expense cards). Issues cards only - does not collect payments.', '["API key", "Merchant ID", "Webhook URL"]')
on conflict (key) do nothing;

insert into public.integration_providers (key, name, category, description, credential_fields) values
  ('ice_cash', 'Ice Cash', 'tax', 'ZINARA vehicle licensing and road access fee payments through Ice Cash kiosks and agents.', '["Merchant ID", "API key"]')
on conflict (key) do nothing;

-- Extend payment method constraints so sales/purchase payments and expenses
-- can record these two new methods, matching the pattern from 000035.
alter table public.sales_payments drop constraint sales_payments_method_check;
alter table public.sales_payments add constraint sales_payments_method_check
  check (method in ('cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney', 'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast', 'card', 'epay_smart', 'ice_cash', 'other'));

alter table public.purchase_payments drop constraint purchase_payments_method_check;
alter table public.purchase_payments add constraint purchase_payments_method_check
  check (method in ('cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney', 'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast', 'card', 'epay_smart', 'ice_cash', 'other'));

alter table public.expenses drop constraint expenses_payment_method_check;
alter table public.expenses add constraint expenses_payment_method_check
  check (payment_method in ('cash', 'bank_transfer', 'zipit', 'zimswitch', 'ecocash', 'onemoney', 'omari', 'innbucks', 'zeepay', 'contipay', 'paynow', 'stripe', 'payfast', 'card', 'epay_smart', 'ice_cash', 'other'));
