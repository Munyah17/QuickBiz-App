"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createExpense, approveExpense, rejectExpense, markExpensePaid } from "@/services/finance";
import { createPaymentRequest, decidePaymentRequest, markPaymentRequestPaid } from "@/services/paymentRequests";

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

export async function approveExpenseAction(_prev: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("expenses.approve")) {
    return { error: "You don't have permission to approve expenses.", success: false };
  }

  try {
    await approveExpense(supabase, orgId, String(formData.get("expenseId") ?? ""));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}

export async function rejectExpenseAction(_prev: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("expenses.approve")) {
    return { error: "You don't have permission to reject expenses.", success: false };
  }

  try {
    await rejectExpense(
      supabase,
      orgId,
      String(formData.get("expenseId") ?? ""),
      String(formData.get("reason") ?? "").trim()
    );
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}

export async function createPaymentRequestAction(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to create payment requests.", success: false };
  }

  const payee = String(formData.get("payee") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const neededBy = String(formData.get("neededBy") ?? "").trim() || null;
  const branchId = String(formData.get("branchId") ?? "") || null;

  if (!payee) return { error: "Payee is required.", success: false };
  if (amount <= 0) return { error: "Amount must be greater than zero.", success: false };
  if (!reason) return { error: "A reason is required.", success: false };

  try {
    await createPaymentRequest(supabase, { orgId, branchId, payee, amount, reason, category, neededBy });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}

export async function decidePaymentRequestAction(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("expenses.approve")) {
    return { error: "You don't have permission to approve payment requests.", success: false };
  }

  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  const note = String(formData.get("note") ?? "").trim();
  if (!["approved", "rejected"].includes(decision)) return { error: "Invalid decision.", success: false };

  try {
    await decidePaymentRequest(supabase, orgId, requestId, decision, note);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}

export async function markPaymentRequestPaidAction(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to mark requests paid.", success: false };
  }

  try {
    await markPaymentRequestPaid(supabase, String(formData.get("requestId") ?? ""));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}

export async function markExpensePaidAction(_prev: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to mark expenses paid.", success: false };
  }

  try {
    await markExpensePaid(
      supabase,
      orgId,
      String(formData.get("expenseId") ?? ""),
      String(formData.get("paymentMethod") ?? ""),
      String(formData.get("reference") ?? "").trim()
    );
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/expenses");
  return { error: null, success: true };
}
