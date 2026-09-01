-- Correct/tighten integration_providers descriptions (000035). Ownership
-- claims for InnBucks and Omari were wrong; fixed against current, verified
-- sources rather than re-guessed. Card acquiring description now names
-- actual Zimbabwean acquiring banks instead of a vague "a local bank".

update public.integration_providers set description =
  'Econet''s mobile money wallet.'
where key = 'ecocash';

update public.integration_providers set description =
  'Old Mutual''s mobile wallet, cashable at OK, Pick n Pay, Spar, and CABS.'
where key = 'omari';

update public.integration_providers set description =
  'InnBucks MicroBank''s digital wallet (Innscor/Simbisa Brands group), also usable as a fast-food loyalty and rewards account.'
where key = 'innbucks';

update public.integration_providers set description =
  'Card acquiring through your bank''s merchant POS/gateway service (CBZ, Stanbic, and others on the ZimSwitch network all offer this) or through Paynow.'
where key = 'card';
