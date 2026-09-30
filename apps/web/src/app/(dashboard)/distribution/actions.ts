"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createDistributionRoute, setDistributionRouteStatus, type DistributionRouteInput } from "@/services/logistics";

export interface DistributionActionState {
  error: string | null;
  success: boolean;
}

export const initialDistributionActionState: DistributionActionState = { error: null, success: false };

export async function createRouteAction(_prev: DistributionActionState, formData: FormData): Promise<DistributionActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");
  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to create routes.", success: false };
  }

  const input: DistributionRouteInput = {
    routeName: String(formData.get("routeName") ?? "").trim(),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    driverId: String(formData.get("driverId") ?? ""),
    scheduledDate: String(formData.get("scheduledDate") ?? ""),
    stops: String(formData.get("stops") ?? ""),
    notes: String(formData.get("notes") ?? "").trim(),
  };
  if (!input.routeName) return { error: "Route name is required.", success: false };

  try {
    await createDistributionRoute(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/distribution");
  return { error: null, success: true };
}

export async function setRouteStatusAction(routeId: string, status: string): Promise<DistributionActionState> {
  const { supabase, permissions } = await requireOrgContext();
  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to update routes.", success: false };
  }
  try {
    await setDistributionRouteStatus(supabase, routeId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
  revalidatePath("/distribution");
  return { error: null, success: true };
}
