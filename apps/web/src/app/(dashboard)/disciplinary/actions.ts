"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  createDisciplinaryCase,
  recordCaseAction,
  closeDisciplinaryCase,
  scheduleDisciplinaryHearing,
  recordHearingOutcome,
  issueDisciplinaryWarning,
} from "@/services/disciplinary";

export interface DisciplinaryActionState {
  error: string | null;
  success: boolean;
}

export const initialDisciplinaryActionState: DisciplinaryActionState = { error: null, success: false };

export async function createCaseAction(_prev: DisciplinaryActionState, formData: FormData): Promise<DisciplinaryActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("disciplinary.manage")) {
    return { error: "You don't have permission to open disciplinary cases.", success: false };
  }

  const employeeId = String(formData.get("employeeId") ?? "");
  const violationType = String(formData.get("violationType") ?? "");
  const severity = String(formData.get("severity") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const incidentDate = String(formData.get("incidentDate") ?? "");

  if (!employeeId || !violationType || !severity || !title || !description || !incidentDate) {
    return { error: "Employee, violation type, severity, title, description, and incident date are required.", success: false };
  }

  try {
    await createDisciplinaryCase(supabase, orgId, { employeeId, violationType, severity, title, description, incidentDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/disciplinary");
  return { error: null, success: true };
}

export async function recordCaseActionAction(_prev: DisciplinaryActionState, formData: FormData): Promise<DisciplinaryActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("disciplinary.manage")) {
    return { error: "You don't have permission to record disciplinary actions.", success: false };
  }

  const caseId = String(formData.get("caseId") ?? "");
  const actionType = String(formData.get("actionType") ?? "");
  const actionTaken = String(formData.get("actionTaken") ?? "").trim();
  const actionEffectiveDate = String(formData.get("actionEffectiveDate") ?? "");

  if (!caseId || !actionType || !actionTaken) {
    return { error: "Action type and details are required.", success: false };
  }

  try {
    await recordCaseAction(supabase, caseId, { actionType, actionTaken, actionEffectiveDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/disciplinary");
  return { error: null, success: true };
}

export async function closeCaseAction(caseId: string): Promise<void> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("disciplinary.manage")) {
    throw new Error("You don't have permission to close disciplinary cases.");
  }

  await closeDisciplinaryCase(supabase, caseId);
  revalidatePath("/disciplinary");
}

export async function scheduleHearingAction(_prev: DisciplinaryActionState, formData: FormData): Promise<DisciplinaryActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("disciplinary.manage")) {
    return { error: "You don't have permission to schedule hearings.", success: false };
  }

  const caseId = String(formData.get("caseId") ?? "");
  const hearingDate = String(formData.get("hearingDate") ?? "");
  const hearingTime = String(formData.get("hearingTime") ?? "");
  const location = String(formData.get("location") ?? "").trim();

  if (!caseId || !hearingDate) {
    return { error: "Case and hearing date are required.", success: false };
  }

  try {
    await scheduleDisciplinaryHearing(supabase, { caseId, hearingDate, hearingTime, location });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/disciplinary");
  return { error: null, success: true };
}

export async function recordHearingOutcomeAction(_prev: DisciplinaryActionState, formData: FormData): Promise<DisciplinaryActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("disciplinary.manage")) {
    return { error: "You don't have permission to record hearing outcomes.", success: false };
  }

  const hearingId = String(formData.get("hearingId") ?? "");
  const outcome = String(formData.get("outcome") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();

  if (!hearingId) {
    return { error: "Hearing is required.", success: false };
  }

  try {
    await recordHearingOutcome(supabase, hearingId, { outcome, decision });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/disciplinary");
  return { error: null, success: true };
}

export async function issueWarningAction(_prev: DisciplinaryActionState, formData: FormData): Promise<DisciplinaryActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  if (!permissions.has("disciplinary.manage")) {
    return { error: "You don't have permission to issue warnings.", success: false };
  }

  const employeeId = String(formData.get("employeeId") ?? "");
  const warningType = String(formData.get("warningType") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const expiresDate = String(formData.get("expiresDate") ?? "");

  if (!employeeId || !warningType || !reason) {
    return { error: "Employee, warning type, and reason are required.", success: false };
  }

  try {
    await issueDisciplinaryWarning(supabase, orgId, { employeeId, warningType, reason, expiresDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/disciplinary");
  return { error: null, success: true };
}
