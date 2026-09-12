"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { issuePettyCashFloat, closePettyCashFloat, recordPettyCashTransaction } from "@/services/pettyCash";

export interface PettyCashActionState {
  error: string | null;
  success: boolean;
}

export const initialPettyCashActionState: PettyCashActionState = { error: null, success: false };

export async function issueFloatAction(_prev: PettyCashActionState, formData: FormData): Promise<PettyCashActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");

  if (!permissions.has("projects.petty_cash")) {
    return { error: "You don't have permission to issue petty cash floats.", success: false };
  }

  const projectId = String(formData.get("projectId") ?? "");
  const fundName = String(formData.get("fundName") ?? "").trim();
  const initialAmount = Number(formData.get("initialAmount") ?? 0);
  const custodianId = String(formData.get("custodianId") ?? "");

  if (!projectId || !fundName || !initialAmount || !custodianId) {
    return { error: "Project, fund name, initial amount, and custodian are required.", success: false };
  }

  try {
    await issuePettyCashFloat(supabase, { projectId, fundName, initialAmount, custodianId });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/petty-cash");
  return { error: null, success: true };
}

export async function closeFloatAction(floatId: string): Promise<void> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");

  if (!permissions.has("projects.petty_cash")) {
    throw new Error("You don't have permission to close petty cash floats.");
  }

  await closePettyCashFloat(supabase, floatId);
  revalidatePath("/petty-cash");
}

export async function recordTransactionAction(_prev: PettyCashActionState, formData: FormData): Promise<PettyCashActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");

  if (!permissions.has("projects.petty_cash")) {
    return { error: "You don't have permission to record petty cash transactions.", success: false };
  }

  const pettyCashId = String(formData.get("pettyCashId") ?? "");
  const transactionType = String(formData.get("transactionType") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const receiptNumber = String(formData.get("receiptNumber") ?? "").trim();
  const recipientId = String(formData.get("recipientId") ?? "");

  if (!pettyCashId || !transactionType || !amount || !description) {
    return { error: "Fund, transaction type, amount, and description are required.", success: false };
  }

  try {
    await recordPettyCashTransaction(supabase, { pettyCashId, transactionType, amount, description, category, receiptNumber, recipientId });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/petty-cash");
  return { error: null, success: true };
}
