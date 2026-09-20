"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";

// Purchase a license for a third-party module. Creates the license row; the
// module's entry URL (from its manifest) is what the org actually launches.
// Billing integration (charging the org) hooks in here when payment
// collection for marketplace purchases is wired.
export async function purchaseModuleLicense(submissionId: string): Promise<{ error?: string }> {
  const { supabase, orgId } = await requireOrgContext();

  const { data: submission, error: fetchError } = await supabase
    .from("module_submissions")
    .select("id, monthly_price_usd, status")
    .eq("id", submissionId)
    .single();
  if (fetchError || !submission) return { error: "Module not found." };
  if (submission.status !== "approved") return { error: "This module isn't available." };

  const { error } = await supabase.from("module_licenses").insert({
    submission_id: submissionId,
    org_id: orgId,
    monthly_price_usd: submission.monthly_price_usd,
    status: "active",
  });
  if (error) {
    if (error.message.includes("unique")) return { error: "You already have a license for this module." };
    return { error: error.message };
  }

  revalidatePath("/modules");
  return {};
}

export async function cancelModuleLicense(submissionId: string): Promise<{ error?: string }> {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase
    .from("module_licenses")
    .update({ status: "cancelled" })
    .eq("submission_id", submissionId)
    .eq("org_id", orgId)
    .eq("status", "active");
  if (error) return { error: error.message };
  revalidatePath("/modules");
  return {};
}
