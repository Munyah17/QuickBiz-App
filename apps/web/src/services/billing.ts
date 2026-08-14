import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface ModulePricing {
  key: string;
  name: string;
  description: string;
  category: string;
  monthly_price_usd: number;
}

export interface BillingSummary {
  billingStatus: "pending" | "active" | "past_due" | "cancelled";
  setupFeePaid: boolean;
  setupFeeUsd: number;
  enabledModules: ModulePricing[];
  monthlyTotalUsd: number;
}

export async function listModulePricing(supabase: SupabaseClient): Promise<ModulePricing[]> {
  const { data, error } = await supabase
    .from("module_catalog")
    .select("key, name, description, category, monthly_price_usd")
    .order("category")
    .order("name");
  if (error) throw error;
  return data as ModulePricing[];
}

export async function getBillingSummary(supabase: SupabaseClient, orgId: string): Promise<BillingSummary> {
  const [{ data: org, error: orgError }, { data: settings, error: settingsError }, { data: enabled, error: modError }] =
    await Promise.all([
      supabase.from("organizations").select("billing_status, setup_fee_paid").eq("id", orgId).single(),
      supabase.from("billing_settings").select("setup_fee_usd").eq("id", true).single(),
      supabase
        .from("org_modules")
        .select("module_catalog(key, name, description, category, monthly_price_usd)")
        .eq("org_id", orgId)
        .eq("status", "enabled"),
    ]);

  if (orgError) throw orgError;
  if (settingsError) throw settingsError;
  if (modError) throw modError;

  const enabledModules = (enabled as unknown as Array<{ module_catalog: ModulePricing | null }>)
    .map((row) => row.module_catalog)
    .filter((m): m is ModulePricing => !!m);

  return {
    billingStatus: org.billing_status as BillingSummary["billingStatus"],
    setupFeePaid: org.setup_fee_paid,
    setupFeeUsd: settings.setup_fee_usd,
    enabledModules,
    monthlyTotalUsd: enabledModules.reduce((sum, m) => sum + m.monthly_price_usd, 0),
  };
}
