"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createWorkOrder, completeWorkOrder, cancelWorkOrder } from "@/services/manufacturing";

export interface WorkOrderActionState {
  error: string | null;
  success: boolean;
}

export const initialWorkOrderActionState: WorkOrderActionState = { error: null, success: false };

export async function createWorkOrderAction(
  _prev: WorkOrderActionState,
  formData: FormData
): Promise<WorkOrderActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");

  if (!permissions.has("manufacturing.manage")) {
    return { error: "You don't have permission to create work orders.", success: false };
  }

  const bomId = String(formData.get("bomId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const quantityPlanned = Number(formData.get("quantityPlanned") ?? 0);

  if (!bomId) return { error: "Choose a bill of materials.", success: false };
  if (!warehouseId) return { error: "Choose a warehouse.", success: false };
  if (!quantityPlanned || quantityPlanned <= 0) return { error: "Enter a quantity to produce.", success: false };

  try {
    await createWorkOrder(supabase, orgId, {
      bomId,
      warehouseId,
      quantityPlanned,
      branchId: String(formData.get("branchId") ?? ""),
      scheduledDate: String(formData.get("scheduledDate") ?? ""),
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/manufacturing/work-orders");
  return { error: null, success: true };
}

export async function completeWorkOrderAction(
  _prev: WorkOrderActionState,
  formData: FormData
): Promise<WorkOrderActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("manufacturing.manage")) {
    return { error: "You don't have permission to complete work orders.", success: false };
  }

  const workOrderId = String(formData.get("workOrderId") ?? "");

  try {
    await completeWorkOrder(supabase, orgId, workOrderId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/manufacturing/work-orders");
  return { error: null, success: true };
}

export async function cancelWorkOrderAction(
  _prev: WorkOrderActionState,
  formData: FormData
): Promise<WorkOrderActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("manufacturing.manage")) {
    return { error: "You don't have permission to cancel work orders.", success: false };
  }

  const workOrderId = String(formData.get("workOrderId") ?? "");

  try {
    await cancelWorkOrder(supabase, workOrderId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/manufacturing/work-orders");
  return { error: null, success: true };
}
