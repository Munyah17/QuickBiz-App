// Zimbabwe's actual local payment rails, named explicitly instead of a
// generic "mobile money"/"card" bucket — the whole point of the Integration
// Hub (see services/integrations.ts) is naming these as first-class,
// connectable providers, so every place a payment method is recorded
// should offer the same real options.
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "zipit", label: "ZIPIT" },
  { value: "zimswitch", label: "ZimSwitch" },
  { value: "ecocash", label: "EcoCash" },
  { value: "onemoney", label: "OneMoney" },
  { value: "omari", label: "Omari" },
  { value: "innbucks", label: "InnBucks" },
  { value: "zeepay", label: "Zeepay" },
  { value: "contipay", label: "ContiPay" },
  { value: "paynow", label: "Paynow" },
  { value: "stripe", label: "Stripe" },
  { value: "payfast", label: "PayFast" },
  { value: "card", label: "Card (Visa/Mastercard)" },
  { value: "other", label: "Other" },
] as const;

export function paymentMethodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value.replace(/_/g, " ");
}
