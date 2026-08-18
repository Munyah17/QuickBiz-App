import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface BomListRow {
  id: string;
  name: string;
  is_active: boolean;
  productName: string;
  productSku: string;
  componentCount: number;
  created_at: string;
}

export async function listBoms(supabase: SupabaseClient, orgId: string): Promise<BomListRow[]> {
  const { data, error } = await supabase
    .from("bill_of_materials")
    .select("id, name, is_active, created_at, products(name, sku), bom_components(id)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
      products: { name: string; sku: string } | null;
      bom_components: Array<{ id: string }>;
    }>
  ).map((row) => ({
    id: row.id,
    name: row.name,
    is_active: row.is_active,
    productName: row.products?.name ?? "Unknown product",
    productSku: row.products?.sku ?? "",
    componentCount: row.bom_components.length,
    created_at: row.created_at,
  }));
}

export interface BomComponentInput {
  componentProductId: string;
  quantityPerUnit: number;
}

export async function createBom(
  supabase: SupabaseClient,
  orgId: string,
  input: { productId: string; name: string; components: BomComponentInput[] }
) {
  const { data: bom, error: bomError } = await supabase
    .from("bill_of_materials")
    .insert({ org_id: orgId, product_id: input.productId, name: input.name })
    .select("id")
    .single();
  if (bomError) throw bomError;

  const rows = input.components
    .filter((c) => c.componentProductId && c.quantityPerUnit > 0)
    .map((c) => ({ org_id: orgId, bom_id: bom.id, component_product_id: c.componentProductId, quantity_per_unit: c.quantityPerUnit }));

  if (rows.length > 0) {
    const { error: compError } = await supabase.from("bom_components").insert(rows);
    if (compError) throw compError;
  }

  return bom.id as string;
}

export interface BomDetail {
  id: string;
  name: string;
  productId: string;
  productName: string;
  components: Array<{ id: string; componentProductId: string; componentName: string; componentSku: string; quantityPerUnit: number }>;
}

export async function getBom(supabase: SupabaseClient, orgId: string, bomId: string): Promise<BomDetail | null> {
  const { data, error } = await supabase
    .from("bill_of_materials")
    .select("id, name, product_id, products(name), bom_components(id, component_product_id, quantity_per_unit, products(name, sku))")
    .eq("org_id", orgId)
    .eq("id", bomId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    name: string;
    product_id: string;
    products: { name: string } | null;
    bom_components: Array<{ id: string; component_product_id: string; quantity_per_unit: number; products: { name: string; sku: string } | null }>;
  };

  return {
    id: row.id,
    name: row.name,
    productId: row.product_id,
    productName: row.products?.name ?? "Unknown product",
    components: row.bom_components.map((c) => ({
      id: c.id,
      componentProductId: c.component_product_id,
      componentName: c.products?.name ?? "Unknown component",
      componentSku: c.products?.sku ?? "",
      quantityPerUnit: c.quantity_per_unit,
    })),
  };
}

export interface WorkOrderRow {
  id: string;
  wo_number: string;
  quantity_planned: number;
  quantity_produced: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | null;
  completed_at: string | null;
  bomName: string;
  productName: string;
  warehouseBranchName: string | null;
  created_at: string;
}

export async function listWorkOrders(supabase: SupabaseClient, orgId: string): Promise<WorkOrderRow[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select(
      "id, wo_number, quantity_planned, quantity_produced, status, scheduled_date, completed_at, created_at, bill_of_materials(name, products(name)), warehouses(branches(name))"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      wo_number: string;
      quantity_planned: number;
      quantity_produced: number;
      status: WorkOrderRow["status"];
      scheduled_date: string | null;
      completed_at: string | null;
      created_at: string;
      bill_of_materials: { name: string; products: { name: string } | null } | null;
      warehouses: { branches: { name: string } | null } | null;
    }>
  ).map((row) => ({
    id: row.id,
    wo_number: row.wo_number,
    quantity_planned: row.quantity_planned,
    quantity_produced: row.quantity_produced,
    status: row.status,
    scheduled_date: row.scheduled_date,
    completed_at: row.completed_at,
    bomName: row.bill_of_materials?.name ?? "Unknown BOM",
    productName: row.bill_of_materials?.products?.name ?? "Unknown product",
    warehouseBranchName: row.warehouses?.branches?.name ?? null,
    created_at: row.created_at,
  }));
}

export async function createWorkOrder(
  supabase: SupabaseClient,
  orgId: string,
  input: { branchId: string; warehouseId: string; bomId: string; quantityPlanned: number; scheduledDate: string }
) {
  const { data: woNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "work_order",
  });
  if (numError) throw numError;

  const { error } = await supabase.from("work_orders").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    warehouse_id: input.warehouseId,
    bom_id: input.bomId,
    wo_number: woNumber,
    quantity_planned: input.quantityPlanned,
    scheduled_date: input.scheduledDate || null,
  });
  if (error) throw error;
}

export async function completeWorkOrder(supabase: SupabaseClient, orgId: string, workOrderId: string) {
  const { error } = await supabase.rpc("complete_work_order", { p_org_id: orgId, p_work_order_id: workOrderId });
  if (error) throw error;
}

export async function cancelWorkOrder(supabase: SupabaseClient, workOrderId: string) {
  const { error } = await supabase.from("work_orders").update({ status: "cancelled" }).eq("id", workOrderId);
  if (error) throw error;
}
