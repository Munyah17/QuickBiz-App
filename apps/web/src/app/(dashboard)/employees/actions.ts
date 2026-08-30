"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createEmployee, updateEmployee, setEmployeeStatus, type Employee, type EmployeeInput } from "@/services/hr";

export interface EmployeeActionState {
  error: string | null;
  success: boolean;
}

export const initialEmployeeActionState: EmployeeActionState = { error: null, success: false };

function inputFromForm(formData: FormData): EmployeeInput {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    position: String(formData.get("position") ?? "").trim(),
    hireDate: String(formData.get("hireDate") ?? ""),
    employmentStatus: String(formData.get("employmentStatus") ?? "active"),
  };
}

export async function createEmployeeAction(_prev: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("hr.manage")) {
    return { error: "You don't have permission to manage employees.", success: false };
  }

  const input = inputFromForm(formData);
  if (!input.fullName) return { error: "Full name is required.", success: false };

  try {
    await createEmployee(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/employees");
  return { error: null, success: true };
}

export async function bulkSetEmployeeStatusAction(
  employeeIds: string[],
  employmentStatus: Employee["employment_status"]
): Promise<EmployeeActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("hr.manage")) {
    return { error: "You don't have permission to manage employees.", success: false };
  }
  if (employeeIds.length === 0) return { error: "No employees selected.", success: false };

  try {
    await Promise.all(employeeIds.map((id) => setEmployeeStatus(supabase, id, employmentStatus)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/employees");
  return { error: null, success: true };
}

export async function updateEmployeeAction(_prev: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("hr.manage")) {
    return { error: "You don't have permission to manage employees.", success: false };
  }

  const employeeId = String(formData.get("employeeId") ?? "");
  const input = inputFromForm(formData);
  if (!input.fullName) return { error: "Full name is required.", success: false };

  try {
    await updateEmployee(supabase, employeeId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/employees");
  return { error: null, success: true };
}
