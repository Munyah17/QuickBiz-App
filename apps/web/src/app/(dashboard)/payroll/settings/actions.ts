"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  updatePayrollTaxSettings,
  createSalaryComponent,
  setSalaryComponentActive,
  type PayeBand,
} from "@/services/payroll";

export interface PayrollSettingsActionState {
  error: string | null;
  success: boolean;
}

export const initialPayrollSettingsActionState: PayrollSettingsActionState = { error: null, success: false };

export async function updateTaxSettingsAction(
  _prev: PayrollSettingsActionState,
  formData: FormData
): Promise<PayrollSettingsActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "payroll");

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage payroll tax settings.", success: false };
  }

  const upTos = formData.getAll("bandUpTo").map(String);
  const rates = formData.getAll("bandRate").map(String);
  const deducts = formData.getAll("bandDeduct").map(String);

  const payeBands: PayeBand[] = upTos
    .map((upTo, i) => ({
      upTo: upTo.trim() === "" ? null : Number(upTo),
      rate: Number(rates[i] ?? 0),
      deduct: Number(deducts[i] ?? 0),
    }))
    .filter((b) => !Number.isNaN(b.rate));

  const ceilingRaw = String(formData.get("nssaInsurableCeiling") ?? "").trim();

  try {
    await updatePayrollTaxSettings(supabase, orgId, {
      payeBands,
      nssaEmployeeRate: Number(formData.get("nssaEmployeeRate") ?? 0),
      nssaEmployerRate: Number(formData.get("nssaEmployerRate") ?? 0),
      nssaInsurableCeiling: ceilingRaw === "" ? null : Number(ceilingRaw),
      aidsLevyRate: Number(formData.get("aidsLevyRate") ?? 0),
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll/settings");
  return { error: null, success: true };
}

export async function createSalaryComponentAction(
  _prev: PayrollSettingsActionState,
  formData: FormData
): Promise<PayrollSettingsActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage salary components.", success: false };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Component name is required.", success: false };

  try {
    await createSalaryComponent(supabase, orgId, {
      name,
      componentType: String(formData.get("componentType") ?? "earning") as "earning" | "deduction",
      calculationMethod: String(formData.get("calculationMethod") ?? "fixed") as "fixed" | "percent_of_basic",
      defaultAmount: Number(formData.get("defaultAmount") ?? 0),
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll/settings");
  return { error: null, success: true };
}

export async function setSalaryComponentActiveAction(
  _prev: PayrollSettingsActionState,
  formData: FormData
): Promise<PayrollSettingsActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage salary components.", success: false };
  }

  const componentId = String(formData.get("componentId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  try {
    await setSalaryComponentActive(supabase, componentId, isActive);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll/settings");
  return { error: null, success: true };
}
