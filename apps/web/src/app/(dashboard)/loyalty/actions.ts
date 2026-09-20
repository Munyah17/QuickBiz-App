"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { recordLoyaltyTransaction } from "@/services/marketing";

export interface LoyaltyActionState {
  error: string | null;
  success: boolean;
}

export const initialLoyaltyActionState: LoyaltyActionState = { error: null, success: false };

export async function recordLoyaltyTransactionAction(
  _prev: LoyaltyActionState,
  formData: FormData
): Promise<LoyaltyActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");

  if (!permissions.has("marketing.manage")) {
    return { error: "You don't have permission to adjust loyalty points.", success: false };
  }

  const customerId = String(formData.get("customerId") ?? "");
  const points = Number(formData.get("points") ?? 0);
  const type = String(formData.get("type") ?? "earn");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!customerId) return { error: "Choose a customer.", success: false };
  if (!points || points <= 0) return { error: "Enter a positive number of points.", success: false };

  try {
    await recordLoyaltyTransaction(supabase, orgId, { customerId, points, type, reason });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/loyalty");
  return { error: null, success: true };
}
