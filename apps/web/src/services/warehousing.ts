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

// ============================================================
// Stock transfers — pending → in_transit → received, with real
// stock_movements on dispatch and receipt.
// ============================================================

export type TransferStatus = "pending" | "in_transit" | "received" | "cancelled";

export interface TransferListRow {
  id: string;
  transfer_number: string;
  fromName: string;
  toName: string;
  status: TransferStatus;
  transfer_date: string;
  lineCount: number;
  totalQuantity: number;
  created_at: string;
}

export async function listTransfers(supabase: SupabaseClient, orgId: string): Promise<TransferListRow[]> {
  const { data, error } = await supabase
    .from("warehouse_transfers")
    .select(
      "id, transfer_number, status, transfer_date, created_at, from_warehouse:warehouses!warehouse_transfers_from_warehouse_id_fkey(name), to_warehouse:warehouses!warehouse_transfers_to_warehouse_id_fkey(name), warehouse_transfer_lines(quantity)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    (data ?? []) as unknown as Array<{
      id: string;
      transfer_number: string;
      status: TransferStatus;
      transfer_date: string;
      created_at: string;
      from_warehouse: { name: string } | null;
      to_warehouse: { name: string } | null;
      warehouse_transfer_lines: Array<{ quantity: number }>;
    }>
  ).map((row) => ({
    id: row.id,
    transfer_number: row.transfer_number,
    fromName: row.from_warehouse?.name ?? "—",
    toName: row.to_warehouse?.name ?? "—",
    status: row.status,
    transfer_date: row.transfer_date,
    lineCount: row.warehouse_transfer_lines.length,
    totalQuantity: row.warehouse_transfer_lines.reduce((s, l) => s + l.quantity, 0),
    created_at: row.created_at,
  }));
}

export interface TransferDetail {
  id: string;
  transfer_number: string;
  fromName: string;
  toName: string;
  status: TransferStatus;
  transfer_date: string;
  notes: string | null;
  created_at: string;
  lines: Array<{ id: string; productName: string; sku: string; quantity: number }>;
}

export async function getTransferDetail(
  supabase: SupabaseClient,
  orgId: string,
  transferId: string
): Promise<TransferDetail | null> {
  const { data, error } = await supabase
    .from("warehouse_transfers")
    .select(
      "id, transfer_number, status, transfer_date, notes, created_at, from_warehouse:warehouses!warehouse_transfers_from_warehouse_id_fkey(name), to_warehouse:warehouses!warehouse_transfers_to_warehouse_id_fkey(name), warehouse_transfer_lines(id, quantity, products(name, sku))"
    )
    .eq("org_id", orgId)
    .eq("id", transferId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    transfer_number: string;
    status: TransferStatus;
    transfer_date: string;
    notes: string | null;
    created_at: string;
    from_warehouse: { name: string } | null;
    to_warehouse: { name: string } | null;
    warehouse_transfer_lines: Array<{ id: string; quantity: number; products: { name: string; sku: string } | null }>;
  };

  return {
    id: row.id,
    transfer_number: row.transfer_number,
    fromName: row.from_warehouse?.name ?? "—",
    toName: row.to_warehouse?.name ?? "—",
    status: row.status,
    transfer_date: row.transfer_date,
    notes: row.notes,
    created_at: row.created_at,
    lines: row.warehouse_transfer_lines.map((l) => ({
      id: l.id,
      productName: l.products?.name ?? "Unknown product",
      sku: l.products?.sku ?? "",
      quantity: l.quantity,
    })),
  };
}

export interface TransferLineInput {
  product_id: string;
  quantity: number;
}

export async function createTransfer(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: TransferLineInput[];
    notes: string;
  }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_transfer_with_lines", {
    p_org_id: input.orgId,
    p_from_warehouse_id: input.fromWarehouseId,
    p_to_warehouse_id: input.toWarehouseId,
    p_items: input.items as never,
    p_notes: input.notes || undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function dispatchTransfer(supabase: SupabaseClient, orgId: string, transferId: string) {
  const { error } = await supabase.rpc("dispatch_transfer", { p_org_id: orgId, p_transfer_id: transferId });
  if (error) throw error;
}

export async function receiveTransfer(supabase: SupabaseClient, orgId: string, transferId: string) {
  const { error } = await supabase.rpc("receive_transfer", { p_org_id: orgId, p_transfer_id: transferId });
  if (error) throw error;
}

export async function cancelTransfer(supabase: SupabaseClient, orgId: string, transferId: string) {
  const { error } = await supabase.rpc("cancel_transfer", { p_org_id: orgId, p_transfer_id: transferId });
  if (error) throw error;
}
