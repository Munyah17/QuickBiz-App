import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface CampaignRow {
  id: string;
  name: string;
  channel: "sms" | "email" | "whatsapp" | "social" | "other";
  message: string;
  target_segment: string | null;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export async function listCampaigns(supabase: SupabaseClient, orgId: string): Promise<CampaignRow[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, channel, message, target_segment, status, scheduled_at, sent_at, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as CampaignRow[];
}

export interface CampaignInput {
  name: string;
  channel: string;
  message: string;
  targetSegment: string;
  branchId: string;
  scheduledAt: string;
}

export async function createCampaign(supabase: SupabaseClient, orgId: string, input: CampaignInput) {
  const { error } = await supabase.from("campaigns").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    name: input.name,
    channel: input.channel,
    message: input.message,
    target_segment: input.targetSegment || null,
    scheduled_at: input.scheduledAt || null,
    status: input.scheduledAt ? "scheduled" : "draft",
  });
  if (error) throw error;
}

export async function updateCampaignStatus(supabase: SupabaseClient, campaignId: string, status: string) {
  const { error } = await supabase
    .from("campaigns")
    .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null })
    .eq("id", campaignId);
  if (error) throw error;
}

export interface LoyaltyBalance {
  customerId: string;
  customerName: string;
  balance: number;
}

export async function listLoyaltyBalances(supabase: SupabaseClient, orgId: string): Promise<LoyaltyBalance[]> {
  const [{ data: customers, error: customersError }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("org_id", orgId).eq("is_active", true).order("name"),
    supabase.from("loyalty_transactions").select("customer_id, points").eq("org_id", orgId),
  ]);
  if (customersError) throw customersError;
  if (txError) throw txError;

  const balances = new Map<string, number>();
  for (const t of (transactions ?? []) as Array<{ customer_id: string; points: number }>) {
    balances.set(t.customer_id, (balances.get(t.customer_id) ?? 0) + t.points);
  }

  return ((customers ?? []) as Array<{ id: string; name: string }>).map((c) => ({
    customerId: c.id,
    customerName: c.name,
    balance: balances.get(c.id) ?? 0,
  }));
}

export interface LoyaltyTransactionRow {
  id: string;
  customerName: string;
  points: number;
  type: "earn" | "redeem" | "adjustment";
  reason: string | null;
  created_at: string;
}

export async function listLoyaltyTransactions(supabase: SupabaseClient, orgId: string): Promise<LoyaltyTransactionRow[]> {
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("id, points, type, reason, created_at, customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  return (data as unknown as Array<Omit<LoyaltyTransactionRow, "customerName"> & { customers: { name: string } | null }>).map((row) => ({
    ...row,
    customerName: row.customers?.name ?? "Unknown customer",
  }));
}

export async function recordLoyaltyTransaction(
  supabase: SupabaseClient,
  orgId: string,
  input: { customerId: string; points: number; type: string; reason: string }
) {
  const { error } = await supabase.from("loyalty_transactions").insert({
    org_id: orgId,
    customer_id: input.customerId,
    points: input.type === "redeem" ? -Math.abs(input.points) : Math.abs(input.points),
    type: input.type,
    reason: input.reason || null,
  });
  if (error) throw error;
}
