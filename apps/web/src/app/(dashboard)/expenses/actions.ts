"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createExpense } from "@/services/finance";

export interface ExpenseActionState {
  error: string | null;
  success: boolean;
}

export const initialExpenseActionState: ExpenseActionState = { error: null, success: false };

export async function createExpenseAction(_prev: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to record expenses.", success: false };
  }

  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const expenseDate = String(formData.get("expenseDate") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const branchId = String(formData.get("branchId") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash");
  const reference = String(formData.get("reference") ?? "").trim();

  if (!description) return { error: "Description is required.", success: false };
  if (amount <= 0) return { error: "Amount must be greater than zero.", success: false };

  try {
    await createExpense(supabase, orgId, { branchId, accountId, description, amount, expenseDate, paymentMethod, reference });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}
