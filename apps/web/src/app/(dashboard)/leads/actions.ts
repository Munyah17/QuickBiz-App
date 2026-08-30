"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createLead, updateLead, convertLead, setLeadStatus, type Lead, type LeadInput } from "@/services/crm";

export interface LeadActionState {
  error: string | null;
  success: boolean;
}

export const initialLeadActionState: LeadActionState = { error: null, success: false };

function inputFromForm(formData: FormData): LeadInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    source: String(formData.get("source") ?? "").trim(),
    status: String(formData.get("status") ?? "new"),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export async function createLeadAction(_prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to manage leads.", success: false };
  }

  const input = inputFromForm(formData);
  if (!input.name) return { error: "Name is required.", success: false };

  try {
    await createLead(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/leads");
  return { error: null, success: true };
}

export async function updateLeadAction(_prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to manage leads.", success: false };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const input = inputFromForm(formData);
  if (!input.name) return { error: "Name is required.", success: false };

  try {
    await updateLead(supabase, leadId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/leads");
  return { error: null, success: true };
}

export async function bulkSetLeadStatusAction(leadIds: string[], status: Lead["status"]): Promise<LeadActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to manage leads.", success: false };
  }
  if (leadIds.length === 0) return { error: "No leads selected.", success: false };

  try {
    await Promise.all(leadIds.map((id) => setLeadStatus(supabase, id, status)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/leads");
  return { error: null, success: true };
}

export async function convertLeadAction(_prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("crm.manage")) {
    return { error: "You don't have permission to convert leads.", success: false };
  }

  const leadId = String(formData.get("leadId") ?? "");

  try {
    await convertLead(supabase, orgId, leadId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/leads");
  revalidatePath("/customers");
  return { error: null, success: true };
}
