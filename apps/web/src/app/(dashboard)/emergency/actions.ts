"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { reportEmergencyIncident, setEmergencyIncidentStatus, type EmergencyIncidentInput } from "@/services/logistics";

export interface EmergencyActionState {
  error: string | null;
  success: boolean;
}

export const initialEmergencyActionState: EmergencyActionState = { error: null, success: false };

export async function reportIncidentAction(_prev: EmergencyActionState, formData: FormData): Promise<EmergencyActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");
  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to report incidents.", success: false };
  }

  const input: EmergencyIncidentInput = {
    shipmentId: String(formData.get("shipmentId") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    type: String(formData.get("type") ?? "other"),
    severity: String(formData.get("severity") ?? "medium"),
    location: String(formData.get("location") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };

  try {
    await reportEmergencyIncident(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/emergency");
  return { error: null, success: true };
}

export async function setIncidentStatusAction(incidentId: string, status: string): Promise<EmergencyActionState> {
  const { supabase, permissions } = await requireOrgContext();
  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to update incidents.", success: false };
  }
  try {
    await setEmergencyIncidentStatus(supabase, incidentId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/emergency");
  return { error: null, success: true };
}
