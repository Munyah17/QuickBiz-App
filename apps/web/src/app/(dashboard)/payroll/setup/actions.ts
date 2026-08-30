"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  setEmployeeBasicSalary,
  assignEmployeeSalaryComponent,
  removeEmployeeSalaryComponent,
} from "@/services/payroll";

export interface SalarySetupActionState {
  error: string | null;
  success: boolean;
}

export const initialSalarySetupActionState: SalarySetupActionState = { error: null, success: false };

export async function setEmployeeBasicSalaryAction(
  _prev: SalarySetupActionState,
  formData: FormData
): Promise<SalarySetupActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "payroll");

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage salaries.", success: false };
  }

  const employeeId = String(formData.get("employeeId") ?? "");
  const basicSalary = Number(formData.get("basicSalary") ?? 0);
  if (basicSalary < 0) return { error: "Basic salary cannot be negative.", success: false };

  try {
    await setEmployeeBasicSalary(supabase, orgId, employeeId, basicSalary);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll/setup");
  return { error: null, success: true };
}

export async function assignSalaryComponentAction(
  _prev: SalarySetupActionState,
  formData: FormData
): Promise<SalarySetupActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage salaries.", success: false };
  }

  const employeeId = String(formData.get("employeeId") ?? "");
  const componentId = String(formData.get("componentId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!employeeId || !componentId) return { error: "Missing employee or component.", success: false };

  try {
    await assignEmployeeSalaryComponent(supabase, orgId, employeeId, componentId, amount);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll/setup");
  return { error: null, success: true };
}

export async function removeSalaryComponentAction(
  _prev: SalarySetupActionState,
  formData: FormData
): Promise<SalarySetupActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("payroll.manage")) {
    return { error: "You don't have permission to manage salaries.", success: false };
  }

  const assignmentId = String(formData.get("assignmentId") ?? "");

  try {
    await removeEmployeeSalaryComponent(supabase, assignmentId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/payroll/setup");
  return { error: null, success: true };
}
