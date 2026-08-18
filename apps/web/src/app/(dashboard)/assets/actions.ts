"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createAsset, updateAssetStatus, recordAssetMaintenance, type AssetInput } from "@/services/assets";

export interface AssetActionState {
  error: string | null;
  success: boolean;
}

export const initialAssetActionState: AssetActionState = { error: null, success: false };

export async function createAssetAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "assets");

  if (!permissions.has("assets.manage")) {
    return { error: "You don't have permission to manage assets.", success: false };
  }

  const input: AssetInput = {
    branchId: String(formData.get("branchId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "equipment"),
    purchaseDate: String(formData.get("purchaseDate") ?? ""),
    purchaseCost: Number(formData.get("purchaseCost") ?? 0),
    usefulLifeYears: Number(formData.get("usefulLifeYears") ?? 5),
    location: String(formData.get("location") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!input.name) return { error: "Asset name is required.", success: false };

  try {
    await createAsset(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/assets");
  return { error: null, success: true };
}

export async function updateAssetStatusAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("assets.manage")) {
    return { error: "You don't have permission to update assets.", success: false };
  }

  const assetId = String(formData.get("assetId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateAssetStatus(supabase, assetId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/assets");
  return { error: null, success: true };
}

export async function recordMaintenanceAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("assets.manage")) {
    return { error: "You don't have permission to log maintenance.", success: false };
  }

  const assetId = String(formData.get("assetId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const cost = Number(formData.get("cost") ?? 0);
  const maintenanceDate = String(formData.get("maintenanceDate") ?? "");

  if (!description) return { error: "Description is required.", success: false };

  try {
    await recordAssetMaintenance(supabase, orgId, assetId, { description, cost, maintenanceDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/assets");
  return { error: null, success: true };
}
