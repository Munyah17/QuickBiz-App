import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

// Modules with a real implementation behind them — every other catalog
// entry stays honestly disabled in the Module Store until it's built too.
export const IMPLEMENTED_MODULE_KEYS = new Set([
  "inventory",
  "sales",
  "pos",
  "purchasing",
  "finance",
  "hr",
  "crm",
  "projects",
  "assets",
  "service_management",
  "fleet",
  "documents",
  "reporting",
  "marketing",
  "manufacturing",
]);

export interface ModuleCatalogEntry {
  key: string;
  name: string;
  description: string;
  category: string;
  monthly_price_usd: number;
  status: "available" | "enabled" | "disabled" | "configuration_required";
}

// No module implementations ship in this foundation build — every catalog
// entry is honestly reported as unavailable rather than pretending toggling
// it does anything.
export async function listModulesForOrg(supabase: SupabaseClient, orgId: string): Promise<ModuleCatalogEntry[]> {
  const [{ data: catalog, error: catalogError }, { data: orgModules, error: orgModulesError }] = await Promise.all([
    supabase.from("module_catalog").select("key, name, description, category, monthly_price_usd").order("category"),
    supabase.from("org_modules").select("module_key, status").eq("org_id", orgId),
  ]);

  if (catalogError) throw catalogError;
  if (orgModulesError) throw orgModulesError;

  const statusByKey = new Map(
    (orgModules ?? []).map((row: { module_key: string; status: string }) => [row.module_key, row.status])
  );

  return (catalog ?? []).map(
    (entry: { key: string; name: string; description: string; category: string; monthly_price_usd: number }) => ({
      ...entry,
      status: (statusByKey.get(entry.key) as ModuleCatalogEntry["status"]) ?? "available",
    })
  );
}

export async function listEnabledModuleKeys(supabase: SupabaseClient, orgId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("org_modules")
    .select("module_key")
    .eq("org_id", orgId)
    .eq("status", "enabled");
  if (error) throw error;
  return (data ?? []).map((row: { module_key: string }) => row.module_key);
}

export async function setModuleStatus(
  supabase: SupabaseClient,
  orgId: string,
  moduleKey: string,
  status: "enabled" | "disabled"
) {
  const { error } = await supabase.from("org_modules").upsert(
    {
      org_id: orgId,
      module_key: moduleKey,
      status,
      enabled_at: status === "enabled" ? new Date().toISOString() : null,
    },
    { onConflict: "org_id,module_key" }
  );
  if (error) throw error;
}
