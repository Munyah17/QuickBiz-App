"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  createSheqIncident,
  recordCorrectiveAction,
  closeIncident,
  createSheqInspection,
  completeInspection,
} from "@/services/sheq";

export interface SheqActionState {
  error: string | null;
  success: boolean;
}

export const initialSheqActionState: SheqActionState = { error: null, success: false };

export async function createIncidentAction(_prev: SheqActionState, formData: FormData): Promise<SheqActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("sheq.manage")) {
    return { error: "You don't have permission to report incidents.", success: false };
  }

  const incidentType = String(formData.get("incidentType") ?? "");
  const severity = String(formData.get("severity") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dateOccurred = String(formData.get("dateOccurred") ?? "");
  const location = String(formData.get("location") ?? "").trim();

  if (!incidentType || !severity || !title || !description || !dateOccurred) {
    return { error: "Type, severity, title, description, and date are required.", success: false };
  }

  try {
    await createSheqIncident(supabase, orgId, { incidentType, severity, title, description, dateOccurred, location });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/sheq");
  return { error: null, success: true };
}

export async function recordCorrectiveActionAction(_prev: SheqActionState, formData: FormData): Promise<SheqActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("sheq.manage")) {
    return { error: "You don't have permission to record corrective actions.", success: false };
  }

  const incidentId = String(formData.get("incidentId") ?? "");
  const rootCause = String(formData.get("rootCause") ?? "").trim();
  const correctiveActions = String(formData.get("correctiveActions") ?? "").trim();
  const preventiveActions = String(formData.get("preventiveActions") ?? "").trim();
  const targetCompletionDate = String(formData.get("targetCompletionDate") ?? "");

  if (!incidentId || !correctiveActions) {
    return { error: "Corrective actions are required.", success: false };
  }

  try {
    await recordCorrectiveAction(supabase, incidentId, { rootCause, correctiveActions, preventiveActions, targetCompletionDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/sheq");
  return { error: null, success: true };
}

export async function closeIncidentAction(incidentId: string): Promise<void> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("sheq.manage")) {
    throw new Error("You don't have permission to close incidents.");
  }

  await closeIncident(supabase, incidentId);
  revalidatePath("/sheq");
}

export async function createInspectionAction(_prev: SheqActionState, formData: FormData): Promise<SheqActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("sheq.audit")) {
    return { error: "You don't have permission to schedule inspections.", success: false };
  }

  const inspectionType = String(formData.get("inspectionType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const scheduledDate = String(formData.get("scheduledDate") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!inspectionType || !title || !scheduledDate) {
    return { error: "Type, title, and scheduled date are required.", success: false };
  }

  try {
    await createSheqInspection(supabase, orgId, { inspectionType, title, scheduledDate, description });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/sheq");
  return { error: null, success: true };
}

export async function completeInspectionAction(_prev: SheqActionState, formData: FormData): Promise<SheqActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("sheq.audit")) {
    return { error: "You don't have permission to complete inspections.", success: false };
  }

  const inspectionId = String(formData.get("inspectionId") ?? "");
  const findings = String(formData.get("findings") ?? "").trim();
  const nonConformities = Number(formData.get("nonConformities") ?? 0);
  const minorIssues = Number(formData.get("minorIssues") ?? 0);
  const majorIssues = Number(formData.get("majorIssues") ?? 0);
  const criticalIssues = Number(formData.get("criticalIssues") ?? 0);
  const followUpRequired = formData.get("followUpRequired") === "on";

  if (!inspectionId) {
    return { error: "Inspection is required.", success: false };
  }

  try {
    await completeInspection(supabase, inspectionId, {
      findings,
      nonConformities,
      minorIssues,
      majorIssues,
      criticalIssues,
      followUpRequired,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/sheq");
  return { error: null, success: true };
}
