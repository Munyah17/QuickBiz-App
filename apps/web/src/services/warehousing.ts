import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  city: string | null;
  managerName: string | null;
  status: string;
  isPrimary: boolean;
}

export async function listWarehouses(supabase: SupabaseClient, orgId: string): Promise<WarehouseRow[]> {
  const { data, error } = await supabase.rpc("list_warehouses", { p_org_id: orgId });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      code: string;
      name: string;
      city: string | null;
      manager_name: string | null;
      status: string;
      is_primary: boolean;
    }>
  ).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    city: row.city,
    managerName: row.manager_name,
    status: row.status,
    isPrimary: row.is_primary,
  }));
}

export interface CreateWarehouseInput {
  code: string;
  name: string;
  address: string;
}

export async function createWarehouse(supabase: SupabaseClient, orgId: string, input: CreateWarehouseInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_warehouse", {
    p_org_id: orgId,
    p_code: input.code,
    p_name: input.name,
    p_address: input.address || undefined,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface WarehouseZoneRow {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  name: string;
  zoneType: string | null;
  area: number | null;
  capacityVolume: number | null;
  status: string;
}

export async function listWarehouseZones(supabase: SupabaseClient, orgId: string): Promise<WarehouseZoneRow[]> {
  const { data, error } = await supabase
    .from("warehouse_zones")
    .select("id, warehouse_id, code, name, zone_type, area, capacity_volume, status, warehouses(name)")
    .eq("org_id", orgId)
    .order("code");
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      warehouse_id: string;
      code: string;
      name: string;
      zone_type: string | null;
      area: number | null;
      capacity_volume: number | null;
      status: string;
      warehouses: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    warehouseId: row.warehouse_id,
    warehouseName: row.warehouses?.name ?? "-",
    code: row.code,
    name: row.name,
    zoneType: row.zone_type,
    area: row.area,
    capacityVolume: row.capacity_volume,
    status: row.status,
  }));
}

export interface CreateWarehouseZoneInput {
  warehouseId: string;
  code: string;
  name: string;
  zoneType: string;
  area: number;
  capacityVolume: number;
}

export async function createWarehouseZone(supabase: SupabaseClient, input: CreateWarehouseZoneInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_warehouse_zone", {
    p_warehouse_id: input.warehouseId,
    p_code: input.code,
    p_name: input.name,
    p_zone_type: input.zoneType,
    p_area: input.area || undefined,
    p_capacity_volume: input.capacityVolume || undefined,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface WarehouseBinRow {
  id: string;
  zoneId: string;
  zoneName: string;
  code: string;
  name: string | null;
  binType: string | null;
  status: string;
}

export async function listWarehouseBins(supabase: SupabaseClient, orgId: string): Promise<WarehouseBinRow[]> {
  const { data, error } = await supabase
    .from("warehouse_bins")
    .select("id, zone_id, code, name, bin_type, status, warehouse_zones(name)")
    .eq("org_id", orgId)
    .order("code");
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      zone_id: string;
      code: string;
      name: string | null;
      bin_type: string | null;
      status: string;
      warehouse_zones: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    zoneId: row.zone_id,
    zoneName: row.warehouse_zones?.name ?? "-",
    code: row.code,
    name: row.name,
    binType: row.bin_type,
    status: row.status,
  }));
}

export interface CreateWarehouseBinInput {
  zoneId: string;
  code: string;
  name: string;
  binType: string;
}

export async function createWarehouseBin(supabase: SupabaseClient, input: CreateWarehouseBinInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_warehouse_bin", {
    p_zone_id: input.zoneId,
    p_code: input.code,
    p_name: input.name || undefined,
    p_bin_type: input.binType || "shelf",
  });
  if (error) throw error;

  return data as unknown as string;
}
