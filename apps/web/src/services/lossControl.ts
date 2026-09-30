import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface LossControlRow {
  id: string;
  quantity: number;
  reason: "expired" | "damaged" | "discarded" | "theft" | "other";
  unit_cost: number;
  total_value: number;
  status: "recorded" | "approved" | "written_off";
  notes: string | null;
  created_at: string;
  productName: string | null;
  warehouseName: string | null;
}

export async function listLossControlRecords(supabase: SupabaseClient, orgId: string): Promise<LossControlRow[]> {
  const { data, error } = await supabase
    .from("loss_control_records")
    .select("id, quantity, reason, unit_cost, total_value, status, notes, created_at, products(name), warehouses(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<
      Omit<LossControlRow, "productName" | "warehouseName"> & {
        products: { name: string } | null;
        warehouses: { name: string } | null;
      }
    >
  ).map((r) => ({
    ...r,
    productName: r.products?.name ?? null,
    warehouseName: r.warehouses?.name ?? null,
  }));
}

export interface LossControlInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  unitCost: number;
  notes: string;
}

export async function recordLoss(supabase: SupabaseClient, orgId: string, input: LossControlInput) {
  const { error } = await supabase.from("loss_control_records").insert({
    org_id: orgId,
    product_id: input.productId || null,
    warehouse_id: input.warehouseId || null,
    quantity: input.quantity,
    reason: input.reason || "expired",
    unit_cost: input.unitCost,
    notes: input.notes || null,
    status: "recorded",
  });
  if (error) throw error;
}

export async function setLossStatus(supabase: SupabaseClient, recordId: string, status: string) {
  const { error } = await supabase.from("loss_control_records").update({ status }).eq("id", recordId);
  if (error) throw error;
}
