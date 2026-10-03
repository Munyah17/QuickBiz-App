import { requireUser } from "@/lib/session";
import { listModulePricing } from "@/services/billing";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Set up your workspace — QuickBiz ERP" };

export default async function OnboardingPage() {
  const { supabase } = await requireUser();

  // Resume support: org created but onboarding abandoned mid-flow → the
  // wizard re-opens at the module picker instead of forcing a duplicate org.
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let alreadyEnabled: string[] = [];
  if (membership) {
    const { data: mods } = await supabase
      .from("org_modules")
      .select("module_key")
      .eq("org_id", membership.org_id)
      .eq("status", "enabled");
    alreadyEnabled = (mods ?? []).map((m) => m.module_key);
  }

  const [catalog, { data: billingSettings }] = await Promise.all([
    listModulePricing(supabase),
    supabase.from("billing_settings").select("setup_fee_usd").eq("id", true).maybeSingle(),
  ]);

  return (
    <OnboardingWizard
      orgId={(membership?.org_id as string | undefined) ?? null}
      catalog={catalog}
      setupFeeUsd={billingSettings?.setup_fee_usd ?? 149}
      alreadyEnabled={alreadyEnabled}
    />
  );
}
