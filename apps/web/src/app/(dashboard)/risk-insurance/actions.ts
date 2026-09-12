"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  createInsurer,
  createInsurancePolicy,
  listPolicyClaims,
  submitInsuranceClaim,
  createRiskAssessment,
  type ClaimRow,
} from "@/services/riskInsurance";

export interface RiskInsuranceActionState {
  error: string | null;
  success: boolean;
}

export const initialRiskInsuranceActionState: RiskInsuranceActionState = { error: null, success: false };

export async function listPolicyClaimsAction(policyId: string): Promise<ClaimRow[]> {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");
  return listPolicyClaims(supabase, policyId);
}

export async function createInsurerAction(
  _prev: RiskInsuranceActionState,
  formData: FormData
): Promise<RiskInsuranceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("risk_insurance.manage")) {
    return { error: "You don't have permission to add insurers.", success: false };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name || !code) {
    return { error: "Name and code are required.", success: false };
  }

  try {
    await createInsurer(supabase, orgId, { name, code, contactPerson, email, phone, address });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/risk-insurance");
  return { error: null, success: true };
}

export async function createPolicyAction(
  _prev: RiskInsuranceActionState,
  formData: FormData
): Promise<RiskInsuranceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("risk_insurance.manage")) {
    return { error: "You don't have permission to create policies.", success: false };
  }

  const insurerId = String(formData.get("insurerId") ?? "");
  const policyNumber = String(formData.get("policyNumber") ?? "").trim();
  const policyType = String(formData.get("policyType") ?? "");
  const coverageType = String(formData.get("coverageType") ?? "").trim();
  const sumInsured = Number(formData.get("sumInsured"));
  const premium = Number(formData.get("premium"));
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const assetId = String(formData.get("assetId") ?? "");
  const vehicleId = String(formData.get("vehicleId") ?? "");

  if (!insurerId || !policyNumber || !policyType || !premium || !startDate || !endDate) {
    return { error: "Insurer, policy number, type, premium, and dates are required.", success: false };
  }

  try {
    await createInsurancePolicy(supabase, orgId, {
      insurerId,
      policyNumber,
      policyType,
      coverageType,
      sumInsured,
      premium,
      startDate,
      endDate,
      assetId,
      vehicleId,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/risk-insurance");
  return { error: null, success: true };
}

export async function submitClaimAction(
  _prev: RiskInsuranceActionState,
  formData: FormData
): Promise<RiskInsuranceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("risk_insurance.claims")) {
    return { error: "You don't have permission to submit claims.", success: false };
  }

  const policyId = String(formData.get("policyId") ?? "");
  const incidentDate = String(formData.get("incidentDate") ?? "");
  const incidentDescription = String(formData.get("incidentDescription") ?? "").trim();
  const claimAmount = Number(formData.get("claimAmount"));

  if (!policyId || !incidentDate || !incidentDescription || !claimAmount) {
    return { error: "Incident date, description, and claim amount are required.", success: false };
  }

  try {
    await submitInsuranceClaim(supabase, policyId, incidentDate, incidentDescription, claimAmount);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/risk-insurance");
  return { error: null, success: true };
}

export async function createRiskAssessmentAction(
  _prev: RiskInsuranceActionState,
  formData: FormData
): Promise<RiskInsuranceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  if (!permissions.has("risk_insurance.assess")) {
    return { error: "You don't have permission to conduct risk assessments.", success: false };
  }

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const likelihood = Number(formData.get("likelihood"));
  const impact = Number(formData.get("impact"));
  const description = String(formData.get("description") ?? "").trim();
  const mitigationStrategy = String(formData.get("mitigationStrategy") ?? "").trim();
  const reviewDate = String(formData.get("reviewDate") ?? "");

  if (!title || !likelihood || !impact) {
    return { error: "Title, likelihood, and impact are required.", success: false };
  }

  try {
    await createRiskAssessment(supabase, orgId, {
      title,
      category,
      likelihood,
      impact,
      description,
      mitigationStrategy,
      reviewDate,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/risk-insurance");
  return { error: null, success: true };
}
