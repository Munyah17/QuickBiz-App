"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createPayrollRun, setPayrollRunStatus, type PayrollRunInput } from "@/services/payroll";

export interface PayrollActionState {
  error: string | null;
  success: boolean;
}

export const initialPayrollActionState: PayrollActionState = { error: null, success: false };

export async function createPayrollRunAction(_prev: PayrollActionState, formData: FormData): Promise<PayrollActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "payroll");

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to run payroll.", success: false };
  }

  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");
  if (!periodStart || !periodEnd) return { error: "Choose a pay period.", success: false };
  if (periodEnd < periodStart) return { error: "Period end must be after period start.", success: false };

  const employeeIds = formData.getAll("employeeId").map(String).filter(Boolean);
  if (employeeIds.length === 0) return { error: "Select at least one employee.", success: false };

  const input: PayrollRunInput = {
    branchId: String(formData.get("branchId") ?? ""),
    periodStart,
    periodEnd,
    payDate: String(formData.get("payDate") ?? ""),
    notes: String(formData.get("notes") ?? "").trim(),
    employeeIds,
  };

  let runId: string;
  try {
    runId = await createPayrollRun(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll");
  redirect(`/payroll/${runId}`);
}

export async function setPayrollRunStatusAction(
  _prev: PayrollActionState,
  formData: FormData
): Promise<PayrollActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage payroll runs.", success: false };
  }

  const runId = String(formData.get("runId") ?? "");
  const status = String(formData.get("status") ?? "") as "draft" | "finalized" | "paid";

  try {
    await setPayrollRunStatus(supabase, runId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll");
  revalidatePath(`/payroll/${runId}`);
  return { error: null, success: true };
}
