import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Json } from "@quickbiz/supabase/database.types";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export async function listCurrencies(supabase: SupabaseClient): Promise<Currency[]> {
  const { data, error } = await supabase.from("currencies").select("code, name, symbol").order("code");
  if (error) throw error;
  return data as Currency[];
}

export async function updateOrganization(
  supabase: SupabaseClient,
  orgId: string,
  input: { name: string; legal_name?: string; currency: string; timezone: string }
) {
  const { error } = await supabase
    .from("organizations")
    .update({
      name: input.name,
      legal_name: input.legal_name || null,
      currency: input.currency,
      timezone: input.timezone,
    })
    .eq("id", orgId);

  if (error) throw error;
}

export async function updateThemeColor(supabase: SupabaseClient, orgId: string, hexColor: string | null) {
  const { error } = await supabase.from("organizations").update({ theme_color: hexColor }).eq("id", orgId);
  if (error) throw error;
}

export async function getOrgSettings(supabase: SupabaseClient, orgId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from("org_settings").select("key, value").eq("org_id", orgId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value]));
}

export async function upsertOrgSetting(supabase: SupabaseClient, orgId: string, key: string, value: Json) {
  const { error } = await supabase.from("org_settings").upsert({ org_id: orgId, key, value });
  if (error) throw error;
}

export async function createOrganization(supabase: SupabaseClient, name: string, branchName: string) {
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_branch_name: branchName,
  });
  if (error) throw error;
  return data as string;
}
