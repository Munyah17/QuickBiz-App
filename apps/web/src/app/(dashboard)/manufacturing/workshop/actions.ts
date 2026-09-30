"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createWorkshopJob, setWorkshopJobStatus, type WorkshopJobInput } from "@/services/workshop";

export interface WorkshopActionState {
  error: string | null;
  success: boolean;
}

export const initialWorkshopActionState: WorkshopActionState = { error: null, success: false };

export async function createWorkshopJobAction(_prev: WorkshopActionState, formData: FormData): Promise<WorkshopActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");
  if (!permissions.has("manufacturing.manage")) {
    return { error: "You don't have permission to create workshop jobs.", success: false };
  }

  const input: WorkshopJobInput = {
    workOrderId: String(formData.get("workOrderId") ?? ""),
    productName: String(formData.get("productName") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    technicianId: String(formData.get("technicianId") ?? ""),
    scheduledStart: String(formData.get("scheduledStart") ?? ""),
    scheduledEnd: String(formData.get("scheduledEnd") ?? ""),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  try {
    await createWorkshopJob(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/manufacturing/workshop");
  return { error: null, success: true };
}

export async function setWorkshopJobStatusAction(jobId: string, status: string): Promise<WorkshopActionState> {
  const { supabase, permissions } = await requireOrgContext();
  if (!permissions.has("manufacturing.manage")) {
    return { error: "You don't have permission to update workshop jobs.", success: false };
  }
  try {
    await setWorkshopJobStatus(supabase, jobId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/manufacturing/workshop");
  return { error: null, success: true };
}
