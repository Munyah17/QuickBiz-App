"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createWarehouse, createWarehouseZone, createWarehouseBin } from "@/services/warehousing";

export interface WarehousingActionState {
  error: string | null;
  success: boolean;
}

export const initialWarehousingActionState: WarehousingActionState = { error: null, success: false };

export async function createWarehouseAction(
  _prev: WarehousingActionState,
  formData: FormData
): Promise<WarehousingActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "warehousing");

  if (!permissions.has("warehousing.manage")) {
    return { error: "You don't have permission to manage warehouses.", success: false };
  }

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!code || !name) {
    return { error: "Code and name are required.", success: false };
  }

  try {
    await createWarehouse(supabase, orgId, { code, name, address });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/warehousing");
  return { error: null, success: true };
}

export async function createWarehouseZoneAction(
  _prev: WarehousingActionState,
  formData: FormData
): Promise<WarehousingActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "warehousing");

  if (!permissions.has("warehousing.manage")) {
    return { error: "You don't have permission to manage warehouse zones.", success: false };
  }

  const warehouseId = String(formData.get("warehouseId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const zoneType = String(formData.get("zoneType") ?? "");
  const area = Number(formData.get("area"));
  const capacityVolume = Number(formData.get("capacityVolume"));

  if (!warehouseId || !code || !name) {
    return { error: "Warehouse, code, and name are required.", success: false };
  }

  try {
    await createWarehouseZone(supabase, { warehouseId, code, name, zoneType, area, capacityVolume });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/warehousing");
  return { error: null, success: true };
}

export async function createWarehouseBinAction(
  _prev: WarehousingActionState,
  formData: FormData
): Promise<WarehousingActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "warehousing");

  if (!permissions.has("warehousing.manage")) {
    return { error: "You don't have permission to manage warehouse bins.", success: false };
  }

  const zoneId = String(formData.get("zoneId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const binType = String(formData.get("binType") ?? "shelf");

  if (!zoneId || !code) {
    return { error: "Zone and code are required.", success: false };
  }

  try {
    await createWarehouseBin(supabase, { zoneId, code, name, binType });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/warehousing");
  return { error: null, success: true };
}
