"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { recordLoss, setLossStatus, type LossControlInput } from "@/services/lossControl";

export interface LossActionState {
  error: string | null;
  success: boolean;
}

export const initialLossActionState: LossActionState = { error: null, success: false };

export async function recordLossAction(_prev: LossActionState, formData: FormData): Promise<LossActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");
  if (!permissions.has("inventory.manage")) {
    return { error: "You don't have permission to record losses.", success: false };
  }

  const input: LossControlInput = {
    productId: String(formData.get("productId") ?? ""),
    warehouseId: String(formData.get("warehouseId") ?? ""),
    quantity: parseFloat(String(formData.get("quantity") ?? "0")) || 0,
    reason: String(formData.get("reason") ?? "expired"),
    unitCost: parseFloat(String(formData.get("unitCost") ?? "0")) || 0,
    notes: String(formData.get("notes") ?? "").trim(),
  };
  if (input.quantity <= 0) return { error: "Quantity must be greater than zero.", success: false };

  try {
    await recordLoss(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/loss-control");
  return { error: null, success: true };
}

export async function setLossStatusAction(recordId: string, status: string): Promise<LossActionState> {
  const { supabase, permissions } = await requireOrgContext();
  if (!permissions.has("inventory.manage")) {
    return { error: "You don't have permission to update loss records.", success: false };
  }
  try {
    await setLossStatus(supabase, recordId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/loss-control");
  return { error: null, success: true };
}
