import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface IntegrationProvider {
  key: string;
  name: string;
  category: "mobile_money" | "gateway" | "bank_rail" | "card";
  description: string;
  credentialFields: string[];
}

export async function listProviders(supabase: SupabaseClient): Promise<IntegrationProvider[]> {
  const { data, error } = await supabase
    .from("integration_providers")
    .select("key, name, category, description, credential_fields")
    .order("category");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    key: row.key,
    name: row.name,
    category: row.category as IntegrationProvider["category"],
    description: row.description,
    credentialFields: row.credential_fields as string[],
  }));
}

export interface IntegrationConnection {
  providerKey: string;
  accountLabel: string;
  isConnected: boolean;
  connectedAt: string;
}

// Credentials never come back from this call — org_integration_connections
// has no select policy at all (default-deny), so this RPC is the only way
// to learn a connection exists, and it deliberately returns only the label
// the org chose for it (e.g. "0771234567"), never the API key/secret.
export async function listConnections(supabase: SupabaseClient, orgId: string): Promise<IntegrationConnection[]> {
  const { data, error } = await supabase.rpc("list_integration_connections", { p_org_id: orgId });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    providerKey: row.provider_key,
    accountLabel: row.account_label,
    isConnected: row.is_connected,
    connectedAt: row.connected_at,
  }));
}

export async function connectIntegration(
  supabase: SupabaseClient,
  orgId: string,
  providerKey: string,
  accountLabel: string,
  credentials: Record<string, string>
) {
  const { error } = await supabase.rpc("connect_integration", {
    p_org_id: orgId,
    p_provider_key: providerKey,
    p_account_label: accountLabel,
    p_credentials: credentials,
  });
  if (error) throw error;
}

export async function disconnectIntegration(supabase: SupabaseClient, orgId: string, providerKey: string) {
  const { error } = await supabase.rpc("disconnect_integration", { p_org_id: orgId, p_provider_key: providerKey });
  if (error) throw error;
}
