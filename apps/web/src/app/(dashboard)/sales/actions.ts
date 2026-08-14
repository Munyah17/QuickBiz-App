"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { createInvoice, recordPayment, type InvoiceLineInput } from "@/services/sales";

export interface SalesActionState {
  error: string | null;
  success: boolean;
}

export const initialSalesActionState: SalesActionState = { error: null, success: false };

export async function createInvoiceAction(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to create invoices.", success: false };
  }

  const branchId = String(formData.get("branchId") ?? "");
  const customerId = String(formData.get("customerId") ?? "") || null;
  const warehouseId = String(formData.get("warehouseId") ?? "") || null;
  const taxTotal = Number(formData.get("taxTotal") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  let items: InvoiceLineInput[];
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

  let invoiceId: string;
  try {
    invoiceId = await createInvoice(supabase, { orgId, branchId, customerId, warehouseId, items, taxTotal, notes });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/sales");
  redirect(`/sales/${invoiceId}`);
}

export async function recordPaymentAction(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to record payments.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "cash");
  const reference = String(formData.get("reference") ?? "").trim();

  if (amount <= 0) return { error: "Enter a payment amount greater than zero.", success: false };

  try {
    await recordPayment(supabase, { orgId, invoiceId, amount, method, reference });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  return { error: null, success: true };
}
