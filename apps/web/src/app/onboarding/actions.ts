"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@quickbiz/supabase/client-server";
import { createOrganization } from "@/services/org";
import { requireUser } from "@/lib/session";

export interface OnboardingState {
  error: string | null;
  orgId?: string;
}

export async function createOrganizationAction(formData: FormData): Promise<OnboardingState> {
  await requireUser();
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!companyName) {
    return { error: "Company name is required." };
  }

  const supabase = await createClient();
  try {
    const orgId = await createOrganization(supabase, companyName, "Head Office");
    return { error: null, orgId };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Final onboarding step ("payment"). No gateway is wired up — billing is
 * staff-assisted per the pricing model in migration 000019 — so this records
 * the activation: selected modules go enabled and the org's billing is marked
 * active with the setup fee invoiced. Swap this for a gateway webhook later.
 */
export async function completeOnboardingAction(moduleKeys: string[]): Promise<{ error: string | null }> {
  const { supabase } = await requireUser();

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (memberError) return { error: memberError.message };
  if (!membership) return { error: "No workspace found — create your company first." };

  const orgId = membership.org_id as string;

  // Validate keys against the catalog so a crafted request can't invent modules.
  const { data: catalog, error: catalogError } = await supabase.from("module_catalog").select("key");
  if (catalogError) return { error: catalogError.message };
  const validKeys = moduleKeys.filter((k) => (catalog ?? []).some((c) => c.key === k));
  if (validKeys.length === 0) return { error: "Select at least one module to continue." };

  const { error: modError } = await supabase.from("org_modules").upsert(
    validKeys.map((key) => ({
      org_id: orgId,
      module_key: key,
      status: "enabled",
      enabled_at: new Date().toISOString(),
    })),
    { onConflict: "org_id,module_key" },
  );
  if (modError) return { error: modError.message };

  const { error: orgError } = await supabase
    .from("organizations")
    .update({ setup_fee_paid: true, billing_status: "active" })
    .eq("id", orgId);
  if (orgError) return { error: orgError.message };

  // Sidebar nav depends on enabled modules — drop the cached shell.
  revalidatePath("/", "layout");
  return { error: null };
}
