"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import {
  createInvoice,
  recordPayment,
  issueInvoice,
  voidInvoice,
  createCreditNote,
  applyCreditNote,
  duplicateInvoice,
  convertQuoteToInvoice,
  updateDraftInvoice,
  type InvoiceLineInput,
} from "@/services/sales";

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
  const dueDate = String(formData.get("dueDate") ?? "").trim() || null;
  const discountTotal = Number(formData.get("discountTotal") ?? 0);
  const discountReason = String(formData.get("discountReason") ?? "").trim();
  const saveAs = String(formData.get("saveAs") ?? "issued");
  const invoiceDate = String(formData.get("invoiceDate") ?? "").trim() || null;
  const reference = String(formData.get("reference") ?? "").trim();
  const salesperson = String(formData.get("salesperson") ?? "").trim();
  const paymentTerms = String(formData.get("paymentTerms") ?? "").trim();
  const shippingTotal = Number(formData.get("shippingTotal") ?? 0);
  const billingAddress = String(formData.get("billingAddress") ?? "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();

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
  if (discountTotal < 0) return { error: "Discount cannot be negative.", success: false };
  if (shippingTotal < 0) return { error: "Shipping cannot be negative.", success: false };

  let invoiceId: string;
  try {
    invoiceId = await createInvoice(supabase, {
      orgId,
      branchId,
      customerId,
      warehouseId,
      items,
      taxTotal,
      notes,
      dueDate,
      discountTotal,
      discountReason,
      status: saveAs === "issued" ? "issued" : "draft",
      docType: saveAs === "quote" ? "quote" : "invoice",
      invoiceDate,
      reference,
      salesperson,
      paymentTerms,
      shippingTotal,
      billingAddress,
      deliveryAddress,
    });
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
  revalidatePath("/sales");
  return { error: null, success: true };
}

export async function issueInvoiceAction(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to issue invoices.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");

  try {
    await issueInvoice(supabase, orgId, invoiceId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  revalidatePath("/sales");
  return { error: null, success: true };
}

export async function duplicateInvoiceAction(
  _prev: SalesActionState,
  formData: FormData
): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to create invoices.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");

  let newId: string;
  try {
    newId = await duplicateInvoice(supabase, orgId, invoiceId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/sales");
  redirect(`/sales/${newId}`);
}

export async function updateDraftInvoiceAction(
  _prev: SalesActionState,
  formData: FormData
): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to edit documents.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const customerId = String(formData.get("customerId") ?? "") || null;
  const taxTotal = Number(formData.get("taxTotal") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "") || null;
  const discountTotal = Number(formData.get("discountTotal") ?? 0);
  const discountReason = String(formData.get("discountReason") ?? "").trim();
  const invoiceDate = String(formData.get("invoiceDate") ?? "").trim() || null;
  const reference = String(formData.get("reference") ?? "").trim();
  const salesperson = String(formData.get("salesperson") ?? "").trim();
  const paymentTerms = String(formData.get("paymentTerms") ?? "").trim();
  const shippingTotal = Number(formData.get("shippingTotal") ?? 0);
  const billingAddress = String(formData.get("billingAddress") ?? "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();

  let items: InvoiceLineInput[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid line items.", success: false };
  }

  if (!invoiceId) return { error: "Missing document.", success: false };
  if (items.length === 0) return { error: "Add at least one line item.", success: false };
  if (items.some((i) => !i.description || i.quantity <= 0)) {
    return { error: "Every line needs a description and a quantity greater than zero.", success: false };
  }
  if (discountTotal < 0) return { error: "Discount cannot be negative.", success: false };
  if (shippingTotal < 0) return { error: "Shipping cannot be negative.", success: false };

  try {
    await updateDraftInvoice(supabase, {
      orgId,
      invoiceId,
      customerId,
      items,
      taxTotal,
      notes,
      dueDate,
      discountTotal,
      discountReason,
      invoiceDate,
      reference,
      salesperson,
      paymentTerms,
      shippingTotal,
      billingAddress,
      deliveryAddress,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  revalidatePath("/sales");
  redirect(`/sales/${invoiceId}`);
}

export async function convertQuoteAction(
  _prev: SalesActionState,
  formData: FormData
): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to convert quotations.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");

  try {
    await convertQuoteToInvoice(supabase, orgId, invoiceId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  revalidatePath("/sales");
  return { error: null, success: true };
}

export async function voidInvoiceAction(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to void invoices.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  try {
    await voidInvoice(supabase, orgId, invoiceId, reason);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  revalidatePath("/sales");
  return { error: null, success: true };
}

export async function createCreditNoteAction(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to create credit notes.", success: false };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const restock = formData.get("restock") === "on";

  let items: InvoiceLineInput[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid credit note items.", success: false };
  }

  if (items.length === 0) return { error: "Select at least one line to credit.", success: false };
  if (items.some((i) => i.quantity <= 0)) {
    return { error: "Every credited line needs a quantity greater than zero.", success: false };
  }

  try {
    await createCreditNote(supabase, { orgId, invoiceId, items, reason, restock });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  return { error: null, success: true };
}

export async function applyCreditNoteAction(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to apply credit notes.", success: false };
  }

  const creditNoteId = String(formData.get("creditNoteId") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");

  try {
    await applyCreditNote(supabase, orgId, creditNoteId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/sales/${invoiceId}`);
  return { error: null, success: true };
}
