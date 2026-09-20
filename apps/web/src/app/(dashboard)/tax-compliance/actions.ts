"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createTaxFiling, submitTaxFiling } from "@/services/taxCompliance";

export interface TaxComplianceActionState {
  error: string | null;
  success: boolean;
}

export const initialTaxComplianceActionState: TaxComplianceActionState = { error: null, success: false };

export async function createTaxFilingAction(
  _prev: TaxComplianceActionState,
  formData: FormData
): Promise<TaxComplianceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("tax_compliance.manage")) {
    return { error: "You don't have permission to create tax filings.", success: false };
  }

  const taxTypeKey = String(formData.get("taxTypeKey") ?? "");
  const year = Number(formData.get("year"));
  const period = Number(formData.get("period"));
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";

  if (!taxTypeKey || !year || !period || !amount) {
    return { error: "Tax type, year, period, and amount are required.", success: false };
  }

  try {
    await createTaxFiling(supabase, orgId, { taxTypeKey, year, period, amount, currency });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tax-compliance");
  return { error: null, success: true };
}

export async function markTaxFilingSubmittedAction(
  _prev: TaxComplianceActionState,
  formData: FormData
): Promise<TaxComplianceActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("tax_compliance.file")) {
    return { error: "You don't have permission to record tax filing submissions.", success: false };
  }

  const filingId = String(formData.get("filingId") ?? "");
  const amount = Number(formData.get("amount"));
  const filingReference = String(formData.get("filingReference") ?? "").trim();

  if (!filingId || !amount) {
    return { error: "Amount is required.", success: false };
  }

  try {
    await submitTaxFiling(supabase, filingId, amount, filingReference || undefined);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tax-compliance");
  return { error: null, success: true };
}
