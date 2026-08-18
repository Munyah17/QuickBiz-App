import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface AssetRow {
  id: string;
  asset_number: string;
  name: string;
  category: "equipment" | "computer" | "furniture" | "other";
  purchase_date: string | null;
  purchase_cost: number;
  useful_life_years: number;
  status: "in_use" | "in_maintenance" | "disposed";
  location: string | null;
  branchName: string | null;
  currentValue: number;
}

function computeCurrentValue(purchaseCost: number, usefulLifeYears: number, purchaseDate: string | null): number {
  if (!purchaseDate || usefulLifeYears <= 0) return purchaseCost;
  const yearsElapsed = (Date.now() - new Date(purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const depreciated = purchaseCost * Math.min(Math.max(yearsElapsed / usefulLifeYears, 0), 1);
  return Math.max(purchaseCost - depreciated, 0);
}

export async function listAssets(supabase: SupabaseClient, orgId: string): Promise<AssetRow[]> {
  const { data, error } = await supabase
    .from("assets")
    .select(
      "id, asset_number, name, category, purchase_date, purchase_cost, useful_life_years, status, location, branches(name)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<
      Omit<AssetRow, "branchName" | "currentValue"> & { branches: { name: string } | null }
    >
  ).map((row) => ({
    ...row,
    branchName: row.branches?.name ?? null,
    currentValue: computeCurrentValue(row.purchase_cost, row.useful_life_years, row.purchase_date),
  }));
}

export interface AssetInput {
  branchId: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  usefulLifeYears: number;
  location: string;
  notes: string;
}

export async function createAsset(supabase: SupabaseClient, orgId: string, input: AssetInput) {
  const { data: assetNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "asset",
  });
  if (numError) throw numError;

  const { error } = await supabase.from("assets").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    asset_number: assetNumber,
    name: input.name,
    category: input.category,
    purchase_date: input.purchaseDate || null,
    purchase_cost: input.purchaseCost,
    useful_life_years: input.usefulLifeYears,
    location: input.location || null,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateAssetStatus(supabase: SupabaseClient, assetId: string, status: string) {
  const { error } = await supabase.from("assets").update({ status }).eq("id", assetId);
  if (error) throw error;
}

export async function recordAssetMaintenance(
  supabase: SupabaseClient,
  orgId: string,
  assetId: string,
  input: { description: string; cost: number; maintenanceDate: string }
) {
  const { error } = await supabase.from("asset_maintenance").insert({
    org_id: orgId,
    asset_id: assetId,
    description: input.description,
    cost: input.cost,
    maintenance_date: input.maintenanceDate || new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}
