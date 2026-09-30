"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  registerFiscalDevice,
  fiscaliseReceipt,
  createVatReturn,
  setFiscalDeviceStatus,
  setVatReturnStatus,
  type FiscalDeviceInput,
  type FiscalReceiptInput,
  type VatReturnInput,
} from "@/services/fiscalisation";

export interface FiscalisationActionState {
  error: string | null;
  success: boolean;
}

export const initialFiscalisationActionState: FiscalisationActionState = { error: null, success: false };

export async function registerDeviceAction(
  _prev: FiscalisationActionState,
  formData: FormData
): Promise<FiscalisationActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");
  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to register fiscal devices.", success: false };
  }

  const input: FiscalDeviceInput = {
    branchId: String(formData.get("branchId") ?? ""),
    deviceSerial: String(formData.get("deviceSerial") ?? "").trim(),
    deviceModel: String(formData.get("deviceModel") ?? "").trim(),
    zimraDeviceId: String(formData.get("zimraDeviceId") ?? "").trim(),
    certificateThumbprint: String(formData.get("certificateThumbprint") ?? "").trim(),
  };
  if (!input.deviceSerial) return { error: "Device serial is required.", success: false };

  try {
    await registerFiscalDevice(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/fiscalisation");
  return { error: null, success: true };
}

export async function fiscaliseReceiptAction(
  _prev: FiscalisationActionState,
  formData: FormData
): Promise<FiscalisationActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");
  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to fiscalise receipts.", success: false };
  }

  const input: FiscalReceiptInput = {
    deviceId: String(formData.get("deviceId") ?? ""),
    salesInvoiceId: String(formData.get("salesInvoiceId") ?? ""),
    receiptTotal: parseFloat(String(formData.get("receiptTotal") ?? "0")) || 0,
    vatAmount: parseFloat(String(formData.get("vatAmount") ?? "0")) || 0,
  };
  if (input.receiptTotal <= 0) return { error: "Receipt total must be greater than zero.", success: false };

  try {
    await fiscaliseReceipt(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/fiscalisation");
  return { error: null, success: true };
}

export async function createVatReturnAction(
  _prev: FiscalisationActionState,
  formData: FormData
): Promise<FiscalisationActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");
  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to create VAT returns.", success: false };
  }

  const input: VatReturnInput = {
    periodStart: String(formData.get("periodStart") ?? ""),
    periodEnd: String(formData.get("periodEnd") ?? ""),
    outputVat: parseFloat(String(formData.get("outputVat") ?? "0")) || 0,
    inputVat: parseFloat(String(formData.get("inputVat") ?? "0")) || 0,
    reference: String(formData.get("reference") ?? "").trim(),
  };
  if (!input.periodStart || !input.periodEnd) return { error: "Both period dates are required.", success: false };

  try {
    await createVatReturn(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/fiscalisation");
  return { error: null, success: true };
}

export async function setDeviceStatusAction(deviceId: string, status: string): Promise<FiscalisationActionState> {
  const { supabase, permissions } = await requireOrgContext();
  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to update devices.", success: false };
  }
  try {
    await setFiscalDeviceStatus(supabase, deviceId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/fiscalisation");
  return { error: null, success: true };
}

export async function setVatReturnStatusAction(returnId: string, status: string): Promise<FiscalisationActionState> {
  const { supabase, permissions } = await requireOrgContext();
  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to update VAT returns.", success: false };
  }
  try {
    await setVatReturnStatus(supabase, returnId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/fiscalisation");
  return { error: null, success: true };
}
