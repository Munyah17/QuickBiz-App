"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { openSession, closeSession, checkout, holdOrder, deleteHeldOrder } from "@/services/pos";
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
  const discountTotal = Number(formData.get("discountTotal") ?? 0);
  const discountReason = String(formData.get("discountReason") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash");

  let items: InvoiceLineInput[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid cart.", success: false };
  }

  if (items.length === 0) return { error: "Cart is empty.", success: false };
  if (discountTotal < 0) return { error: "Discount cannot be negative.", success: false };

  // Split tender: optional second payment line. The first tender takes
  // whatever the second doesn't cover.
  const secondMethod = String(formData.get("paymentMethod2") ?? "");
  const secondAmount = Number(formData.get("paymentAmount2") ?? 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const total = subtotal + taxTotal - discountTotal;

  let payments: Array<{ method: string; amount: number }> | undefined;
  if (secondMethod && secondAmount > 0) {
    if (secondAmount >= total) {
      return { error: "Second payment must be less than the total.", success: false };
    }
    payments = [
      { method: paymentMethod, amount: Math.round((total - secondAmount) * 100) / 100 },
      { method: secondMethod, amount: secondAmount },
    ];
  }

  let invoiceId: string;
  try {
    invoiceId = await checkout(supabase, {
      orgId,
      branchId,
      warehouseId,
      sessionId,
      customerId,
      items,
      taxTotal,
      discountTotal,
      discountReason,
      payments,
      paymentMethod,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  const receipt = await getInvoiceDetail(supabase, orgId, invoiceId);

  revalidatePath("/pos");
  return { error: null, success: true, receipt };
}

export async function holdOrderAction(_prev: PosActionState, formData: FormData): Promise<PosActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to hold orders.", success: false };
  }

  const sessionId = String(formData.get("sessionId") ?? "");
  const registerId = String(formData.get("registerId") ?? "");
  const customerId = String(formData.get("customerId") ?? "") || null;

  let cart: Array<{ product_id: string; name: string; unit_price: number; quantity: number }>;
  try {
    cart = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { error: "Invalid cart.", success: false };
  }

  if (cart.length === 0) return { error: "Cart is empty — nothing to hold.", success: false };

  // Default label: "3 items — Cement 50kg" style, so staff can spot the right hold at a glance.
  const label =
    String(formData.get("label") ?? "").trim() ||
    `${cart.length} item${cart.length === 1 ? "" : "s"} — ${cart[0]?.name ?? "order"}`;

  try {
    await holdOrder(supabase, { orgId, sessionId, registerId, customerId, label, cart });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/pos");
  return { error: null, success: true };
}

export async function deleteHeldOrderAction(_prev: PosActionState, formData: FormData): Promise<PosActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("sales.manage")) {
    return { error: "You don't have permission to manage held orders.", success: false };
  }

  const heldOrderId = String(formData.get("heldOrderId") ?? "");

  try {
    await deleteHeldOrder(supabase, heldOrderId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/pos");
  return { error: null, success: true };
}
