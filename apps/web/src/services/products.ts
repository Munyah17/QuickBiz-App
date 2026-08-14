import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface ProductWithStock {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryName: string | null;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  is_active: boolean;
  totalStock: number;
}

export async function listProductsWithStock(supabase: SupabaseClient, orgId: string): Promise<ProductWithStock[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, description, unit_of_measure, cost_price, selling_price, reorder_level, is_active, product_categories(name), stock_levels(quantity_on_hand)"
    )
    .eq("org_id", orgId)
    .order("name");

  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      sku: string;
      name: string;
      description: string | null;
      unit_of_measure: string;
      cost_price: number;
      selling_price: number;
      reorder_level: number;
      is_active: boolean;
      product_categories: { name: string } | null;
      stock_levels: Array<{ quantity_on_hand: number }>;
    }>
  ).map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    categoryName: row.product_categories?.name ?? null,
    unit_of_measure: row.unit_of_measure,
    cost_price: row.cost_price,
    selling_price: row.selling_price,
    reorder_level: row.reorder_level,
    is_active: row.is_active,
    totalStock: row.stock_levels.reduce((sum, s) => sum + s.quantity_on_hand, 0),
  }));
}

export interface InventoryDashboardStats {
  productCount: number;
  lowStockCount: number;
}

export async function getInventoryStats(supabase: SupabaseClient, orgId: string): Promise<InventoryDashboardStats> {
  const products = await listProductsWithStock(supabase, orgId);
  const active = products.filter((p) => p.is_active);
  return {
    productCount: active.length,
    lowStockCount: active.filter((p) => p.totalStock <= p.reorder_level).length,
  };
}

export interface ProductInput {
  sku: string;
  name: string;
  description: string;
  categoryName: string;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
}

async function resolveCategoryId(supabase: SupabaseClient, orgId: string, categoryName: string): Promise<string | null> {
  const trimmed = categoryName.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from("product_categories")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", trimmed)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("product_categories")
    .insert({ org_id: orgId, name: trimmed })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function createProduct(supabase: SupabaseClient, orgId: string, input: ProductInput) {
  const categoryId = await resolveCategoryId(supabase, orgId, input.categoryName);

  const { error } = await supabase.from("products").insert({
    org_id: orgId,
    category_id: categoryId,
    sku: input.sku,
    name: input.name,
    description: input.description || null,
    unit_of_measure: input.unit_of_measure || "each",
    cost_price: input.cost_price,
    selling_price: input.selling_price,
    reorder_level: input.reorder_level,
  });
  if (error) throw error;
}

export async function updateProduct(supabase: SupabaseClient, orgId: string, productId: string, input: ProductInput) {
  const categoryId = await resolveCategoryId(supabase, orgId, input.categoryName);

  const { error } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      sku: input.sku,
      name: input.name,
      description: input.description || null,
      unit_of_measure: input.unit_of_measure || "each",
      cost_price: input.cost_price,
      selling_price: input.selling_price,
      reorder_level: input.reorder_level,
    })
    .eq("id", productId);
  if (error) throw error;
}

export async function setProductActive(supabase: SupabaseClient, productId: string, isActive: boolean) {
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
  if (error) throw error;
}

export interface BranchWarehouse {
  warehouseId: string;
  branchId: string;
  branchName: string;
}

export async function listWarehouses(supabase: SupabaseClient, orgId: string): Promise<BranchWarehouse[]> {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, branch_id, branches(name)")
    .eq("org_id", orgId)
    .order("id");
  if (error) throw error;
  return (data as unknown as Array<{ id: string; branch_id: string; branches: { name: string } | null }>).map((w) => ({
    warehouseId: w.id,
    branchId: w.branch_id,
    branchName: w.branches?.name ?? "Branch",
  }));
}

export interface ProductStockByBranch {
  warehouseId: string;
  branchName: string;
  quantityOnHand: number;
}

export async function getProductStockByBranch(
  supabase: SupabaseClient,
  orgId: string,
  productId: string
): Promise<ProductStockByBranch[]> {
  const warehouses = await listWarehouses(supabase, orgId);
  const { data, error } = await supabase
    .from("stock_levels")
    .select("warehouse_id, quantity_on_hand")
    .eq("org_id", orgId)
    .eq("product_id", productId);
  if (error) throw error;

  const qtyByWarehouse = new Map((data ?? []).map((row: { warehouse_id: string; quantity_on_hand: number }) => [row.warehouse_id, row.quantity_on_hand]));

  return warehouses.map((w) => ({
    warehouseId: w.warehouseId,
    branchName: w.branchName,
    quantityOnHand: qtyByWarehouse.get(w.warehouseId) ?? 0,
  }));
}

export async function adjustStock(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  warehouseId: string,
  quantityDelta: number,
  reference: string
) {
  const { error } = await supabase.rpc("adjust_stock", {
    p_org_id: orgId,
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_quantity_delta: quantityDelta,
    p_reason: "adjustment",
    p_reference: reference || undefined,
  });
  if (error) throw error;
}
