"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createSubscription, updateSubscription, type SubscriptionInput } from "@/services/subscriptions";

export interface FinanceActionState {
  error: string | null;
  success: boolean;
}

export const initialFinanceActionState: FinanceActionState = { error: null, success: false };

export async function createSubscriptionAction(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to manage subscriptions.", success: false };
  }

  const input: SubscriptionInput = {
    direction: String(formData.get("direction") ?? "outgoing") as SubscriptionInput["direction"],
    name: String(formData.get("name") ?? "").trim(),
    counterparty: String(formData.get("counterparty") ?? "").trim(),
    amount: Number(formData.get("amount") ?? 0),
    currency: String(formData.get("currency") ?? "USD").trim() || "USD",
    billingCycle: String(formData.get("billingCycle") ?? "monthly") as SubscriptionInput["billingCycle"],
    startDate: String(formData.get("startDate") ?? ""),
    nextRenewalDate: String(formData.get("nextRenewalDate") ?? "").trim() || null,
    autoRenew: formData.get("autoRenew") === "on",
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!input.name) return { error: "A subscription name is required.", success: false };
  if (!input.counterparty) return { error: "Who is this with? (customer or vendor name)", success: false };
  if (input.amount <= 0) return { error: "Amount must be greater than zero.", success: false };
  if (!input.startDate) return { error: "Start date is required.", success: false };

  try {
    await createSubscription(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/finance");
  return { error: null, success: true };
}

export async function setSubscriptionStatusAction(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to manage subscriptions.", success: false };
  }

  const id = String(formData.get("subscriptionId") ?? "");
  const status = String(formData.get("status") ?? "") as "active" | "paused" | "cancelled" | "expired";
  if (!["active", "paused", "cancelled", "expired"].includes(status)) {
    return { error: "Invalid status.", success: false };
  }

  try {
    await updateSubscription(supabase, id, { status });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/finance");
  return { error: null, success: true };
}
