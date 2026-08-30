"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createOpportunity, updateOpportunityStage, type OpportunityInput } from "@/services/crm";

export interface OpportunityActionState {
  error: string | null;
  success: boolean;
}

export const initialOpportunityActionState: OpportunityActionState = { error: null, success: false };

export async function createOpportunityAction(
  _prev: OpportunityActionState,
  formData: FormData
): Promise<OpportunityActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to manage opportunities.", success: false };
  }

  const input: OpportunityInput = {
    customerId: String(formData.get("customerId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    stage: String(formData.get("stage") ?? "prospecting"),
    value: Number(formData.get("value") ?? 0),
    expectedCloseDate: String(formData.get("expectedCloseDate") ?? ""),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!input.name) return { error: "Name is required.", success: false };

  try {
    await createOpportunity(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/opportunities");
  return { error: null, success: true };
}

export async function updateOpportunityStageAction(
  _prev: OpportunityActionState,
  formData: FormData
): Promise<OpportunityActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to manage opportunities.", success: false };
  }

  const opportunityId = String(formData.get("opportunityId") ?? "");
  const stage = String(formData.get("stage") ?? "");

  try {
    await updateOpportunityStage(supabase, opportunityId, stage);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/opportunities");
  return { error: null, success: true };
}

export async function bulkSetOpportunityStageAction(opportunityIds: string[], stage: string): Promise<OpportunityActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to manage opportunities.", success: false };
  }
  if (opportunityIds.length === 0) return { error: "No opportunities selected.", success: false };

  try {
    await Promise.all(opportunityIds.map((id) => updateOpportunityStage(supabase, id, stage)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/opportunities");
  return { error: null, success: true };
}
