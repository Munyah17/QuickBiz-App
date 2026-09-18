"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createSupplier, updateSupplier, setSupplierActive, importSuppliers, type SupplierInput, type SupplierImportResult } from "@/services/purchasing";

export interface SupplierActionState {
  error: string | null;
  success: boolean;
}

export const initialSupplierActionState: SupplierActionState = { error: null, success: false };

function inputFromForm(formData: FormData): SupplierInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    tax_number: String(formData.get("tax_number") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
  };
}

export async function createSupplierAction(_prev: SupplierActionState, formData: FormData): Promise<SupplierActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to manage suppliers.", success: false };
  }

  const input = inputFromForm(formData);
  if (!input.name) return { error: "Supplier name is required.", success: false };

  try {
    await createSupplier(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/suppliers");
  return { error: null, success: true };
}

export async function updateSupplierAction(_prev: SupplierActionState, formData: FormData): Promise<SupplierActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to manage suppliers.", success: false };
  }

  const supplierId = String(formData.get("supplierId") ?? "");
  const input = inputFromForm(formData);
  if (!input.name) return { error: "Supplier name is required.", success: false };

  try {
    await updateSupplier(supabase, supplierId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/suppliers");
  return { error: null, success: true };
}

export async function setSupplierActiveAction(_prev: SupplierActionState, formData: FormData): Promise<SupplierActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to manage suppliers.", success: false };
  }

  const supplierId = String(formData.get("supplierId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  try {
    await setSupplierActive(supabase, supplierId, isActive);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/suppliers");
  return { error: null, success: true };
}

export interface SupplierImportActionState {
  result: SupplierImportResult | null;
  error: string | null;
}

export const initialSupplierImportActionState: SupplierImportActionState = { result: null, error: null };

export async function importSuppliersAction(
  _prev: SupplierImportActionState,
  formData: FormData
): Promise<SupplierImportActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { result: null, error: "You don't have permission to manage suppliers." };
  }

  let rows: SupplierInput[];
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { result: null, error: "Invalid import payload." };
  }
  if (rows.length === 0) return { result: null, error: "Nothing to import." };
  if (rows.length > 500) return { result: null, error: "Import at most 500 suppliers at a time." };

  try {
    const result = await importSuppliers(supabase, orgId, rows);
    revalidatePath("/suppliers");
    return { result, error: null };
  } catch (err) {
    return { result: null, error: (err as Error).message };
  }
}

export async function bulkSetSupplierActiveAction(supplierIds: string[], isActive: boolean): Promise<SupplierActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("purchasing.manage")) {
    return { error: "You don't have permission to manage suppliers.", success: false };
  }
  if (supplierIds.length === 0) return { error: "No suppliers selected.", success: false };

  try {
    await Promise.all(supplierIds.map((id) => setSupplierActive(supabase, id, isActive)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/suppliers");
  return { error: null, success: true };
}
