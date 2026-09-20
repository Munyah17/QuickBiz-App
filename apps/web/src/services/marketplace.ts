import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface MarketplaceModule {
  submissionId: string;
  moduleKey: string;
  name: string;
  description: string;
  category: string;
  version: string;
  monthlyPriceUsd: number;
  developerName: string;
  /** Whether this org already holds an active license. */
  licensed: boolean;
}

// Approved third-party modules, annotated with this org's license status.
export async function listMarketplaceModules(supabase: SupabaseClient, orgId: string): Promise<MarketplaceModule[]> {
  const { data, error } = await supabase
    .from("module_submissions")
    .select(
      "id, module_key, name, description, category, version, monthly_price_usd, developers(display_name, company_name), module_licenses(id, org_id, status)"
    )
    .eq("status", "approved")
    .order("name");
  if (error) throw error;

  return (data ?? []).map((s) => {
    const dev = s.developers as unknown as { display_name: string; company_name: string | null } | null;
    const licenses = (s.module_licenses as unknown as Array<{ id: string; org_id: string; status: string }>) ?? [];
    return {
      submissionId: s.id,
      moduleKey: s.module_key,
      name: s.name,
      description: s.description,
      category: s.category,
      version: s.version,
      monthlyPriceUsd: s.monthly_price_usd,
      developerName: dev?.company_name ?? dev?.display_name ?? "Third-party",
      licensed: licenses.some((l) => l.org_id === orgId && l.status === "active"),
    };
  });
}
