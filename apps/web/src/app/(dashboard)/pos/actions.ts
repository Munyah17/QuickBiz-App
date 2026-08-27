"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { openSession, closeSession, checkout } from "@/services/pos";
import { getInvoiceDetail, type InvoiceLineInput, type InvoiceDetail } from "@/services/sales";

export interface PosActionState {
  error: string | null;
  success: boolean;
  receipt?: InvoiceDetail | null;
}

export const initialPosActionState: PosActionState = { error: null, success: false };

export async function openSessionAction(_prev: PosActionState, formData: FormData): Promise<PosActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to open a register.", success: false };
  }

  const registerId = String(formData.get("registerId") ?? "");
  const openingFloat = Number(formData.get("openingFloat") ?? 0);

  try {
    await openSession(supabase, orgId, registerId, openingFloat);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/pos");
  return { error: null, success: true };
}

export async function closeSessionAction(_prev: PosActionState, formData: FormData): Promise<PosActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to close the register.", success: false };
  }

  const sessionId = String(formData.get("sessionId") ?? "");
  const closingFloat = Number(formData.get("closingFloat") ?? 0);

  try {
    await closeSession(supabase, orgId, sessionId, closingFloat);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/pos");
  return { error: null, success: true };
}

export async function checkoutAction(_prev: PosActionState, formData: FormData): Promise<PosActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to sell.", success: false };
  }

  const branchId = String(formData.get("branchId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  const customerId = String(formData.get("customerId") ?? "") || null;
  const taxTotal = Number(formData.get("taxTotal") ?? 0);
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash");

  let items: InvoiceLineInput[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid cart.", success: false };
  }

  if (items.length === 0) return { error: "Cart is empty.", success: false };

  let invoiceId: string;
  try {
    invoiceId = await checkout(supabase, { orgId, branchId, warehouseId, sessionId, customerId, items, taxTotal, paymentMethod });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  const receipt = await getInvoiceDetail(supabase, orgId, invoiceId);

  revalidatePath("/pos");
  return { error: null, success: true, receipt };
}
