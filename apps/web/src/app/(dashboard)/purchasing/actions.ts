"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { createPurchaseOrder, receivePurchaseOrder, recordPurchasePayment, type PurchaseOrderLineInput } from "@/services/purchasing";

export interface PurchasingActionState {
  error: string | null;
  success: boolean;
}

export const initialPurchasingActionState: PurchasingActionState = { error: null, success: false };

export async function createPurchaseOrderAction(
  _prev: PurchasingActionState,
  formData: FormData
): Promise<PurchasingActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to create purchase orders.", success: false };
  }

  const branchId = String(formData.get("branchId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "") || null;
  const taxTotal = Number(formData.get("taxTotal") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  let items: PurchaseOrderLineInput[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid line items.", success: false };
  }

  if (!branchId) return { error: "Choose a branch.", success: false };
  if (items.length === 0) return { error: "Add at least one line item.", success: false };
  if (items.some((i) => !i.description || i.quantity <= 0)) {
    return { error: "Every line needs a description and a quantity greater than zero.", success: false };
  }

  let poId: string;
  try {
    poId = await createPurchaseOrder(supabase, { orgId, branchId, supplierId, items, taxTotal, notes });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/purchasing");
  redirect(`/purchasing/${poId}`);
}

export async function receivePurchaseOrderAction(
  _prev: PurchasingActionState,
  formData: FormData
): Promise<PurchasingActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to receive goods.", success: false };
  }

  const poId = String(formData.get("poId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!warehouseId) return { error: "Choose a branch to receive stock into.", success: false };

  try {
    await receivePurchaseOrder(supabase, orgId, poId, warehouseId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/purchasing/${poId}`);
  return { error: null, success: true };
}

export async function recordPurchasePaymentAction(
  _prev: PurchasingActionState,
  formData: FormData
): Promise<PurchasingActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to record payments.", success: false };
  }

  const poId = String(formData.get("poId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "bank_transfer");
  const reference = String(formData.get("reference") ?? "").trim();

  if (amount <= 0) return { error: "Enter a payment amount greater than zero.", success: false };

  try {
    await recordPurchasePayment(supabase, { orgId, poId, amount, method, reference });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/purchasing/${poId}`);
  return { error: null, success: true };
}
