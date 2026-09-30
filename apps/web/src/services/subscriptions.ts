import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Database } from "@quickbiz/supabase/database.types";

type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

export type SubscriptionDirection = "incoming" | "outgoing";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired";
export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly" | "once";

export interface Subscription {
  id: string;
  direction: SubscriptionDirection;
  name: string;
  counterparty: string;
  customer_id: string | null;
  supplier_id: string | null;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  start_date: string;
  next_renewal_date: string | null;
  auto_renew: boolean;
  status: SubscriptionStatus;
  notes: string | null;
  created_at: string;
}

export async function listSubscriptions(
  supabase: SupabaseClient,
  orgId: string,
  direction?: SubscriptionDirection
): Promise<Subscription[]> {
  let q = supabase
    .from("subscriptions")
    .select(
      "id, direction, name, counterparty, customer_id, supplier_id, amount, currency, billing_cycle, start_date, next_renewal_date, auto_renew, status, notes, created_at"
    )
    .eq("org_id", orgId)
    .order("next_renewal_date", { ascending: true, nullsFirst: false });
  if (direction) q = q.eq("direction", direction);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Subscription[];
}

export interface SubscriptionInput {
  direction: SubscriptionDirection;
  name: string;
  counterparty: string;
  customerId?: string | null;
  supplierId?: string | null;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  nextRenewalDate?: string | null;
  autoRenew: boolean;
  notes?: string;
}

export async function createSubscription(supabase: SupabaseClient, orgId: string, input: SubscriptionInput) {
  const { error } = await supabase.from("subscriptions").insert({
    org_id: orgId,
    direction: input.direction,
    name: input.name,
    counterparty: input.counterparty,
    customer_id: input.customerId ?? null,
    supplier_id: input.supplierId ?? null,
    amount: input.amount,
    currency: input.currency,
    billing_cycle: input.billingCycle,
    start_date: input.startDate,
    next_renewal_date: input.nextRenewalDate ?? null,
    auto_renew: input.autoRenew,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateSubscription(
  supabase: SupabaseClient,
  subscriptionId: string,
  input: Partial<SubscriptionInput> & { status?: SubscriptionStatus }
) {
  // supabase-js drops undefined keys, so only provided fields are updated.
  const { error } = await supabase
    .from("subscriptions")
    .update({
      name: input.name,
      counterparty: input.counterparty,
      amount: input.amount,
      currency: input.currency,
      billing_cycle: input.billingCycle,
      start_date: input.startDate,
      next_renewal_date: input.nextRenewalDate,
      auto_renew: input.autoRenew,
      notes: input.notes === undefined ? undefined : input.notes || null,
      status: input.status,
    })
    .eq("id", subscriptionId);
  if (error) throw error;
}

/** Days until renewal — negative means overdue. */
export function daysUntilRenewal(nextRenewalDate: string | null): number | null {
  if (!nextRenewalDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  return Math.floor((Date.parse(nextRenewalDate) - Date.parse(today)) / 86400000);
}
