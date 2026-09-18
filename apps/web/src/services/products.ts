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
  barcode: string | null;
  is_active: boolean;
  totalStock: number;
}

export async function listProductsWithStock(supabase: SupabaseClient, orgId: string): Promise<ProductWithStock[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, description, unit_of_measure, cost_price, selling_price, reorder_level, barcode, is_active, product_categories(name), stock_levels(quantity_on_hand)"
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
      barcode: string | null;
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
    barcode: row.barcode,
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
  barcode?: string;
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
    barcode: input.barcode || null,
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
      barcode: input.barcode || null,
    })
    .eq("id", productId);
  if (error) throw error;
}

export async function setProductActive(supabase: SupabaseClient, productId: string, isActive: boolean) {
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
  if (error) throw error;
}

/** Bulk price update — `percent` adjusts selling_price by +/- %, `fixed` sets it outright. */
export async function bulkUpdatePrices(
  supabase: SupabaseClient,
  orgId: string,
  productIds: string[],
  mode: "percent" | "fixed",
  value: number
) {
  if (productIds.length === 0) return;
  if (mode === "percent") {
    if (value <= -100) throw new Error("A decrease of 100% or more would zero out prices.");
    const { data: rows, error: readError } = await supabase
      .from("products")
      .select("id, selling_price")
      .eq("org_id", orgId)
      .in("id", productIds);
    if (readError) throw readError;
    const factor = 1 + value / 100;
    for (const row of (rows ?? []) as Array<{ id: string; selling_price: number }>) {
      const newPrice = Math.max(0, Math.round(row.selling_price * factor * 100) / 100);
      const { error } = await supabase.from("products").update({ selling_price: newPrice }).eq("id", row.id);
      if (error) throw error;
    }
    return;
  }
  if (value < 0) throw new Error("Price cannot be negative.");
  const { error } = await supabase
    .from("products")
    .update({ selling_price: value })
    .eq("org_id", orgId)
    .in("id", productIds);
  if (error) throw error;
}

// ============================================================
// Bulk import — CSV rows land as products; existing SKUs (in the
// org or earlier in the file) are skipped so imports are re-runnable.
// ============================================================

export interface ImportResult {
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ sku: string; reason: string }>;
}

export async function importProducts(
  supabase: SupabaseClient,
  orgId: string,
  rows: ProductInput[]
): Promise<ImportResult> {
  const { data: existing, error } = await supabase.from("products").select("sku").eq("org_id", orgId);
  if (error) throw error;

  const seen = new Set((existing ?? []).map((r: { sku: string }) => r.sku.toLowerCase()));
  const result: ImportResult = { created: 0, skipped: 0, failed: 0, errors: [] };

  for (const row of rows) {
    const key = row.sku.toLowerCase();
    if (seen.has(key)) {
      result.skipped += 1;
      continue;
    }
    try {
      await createProduct(supabase, orgId, row);
      seen.add(key);
      result.created += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ sku: row.sku || "(no sku)", reason: (err as Error).message });
    }
  }

  return result;
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

// ============================================================
// Product detail — full stock picture: on-hand per warehouse, the
// append-only movement ledger, and lifetime sales pulled from invoice lines.
// ============================================================

export interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryName: string | null;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  totalStock: number;
  stockValue: number;
  stockByWarehouse: Array<{ warehouseId: string; warehouseName: string; branchName: string; quantityOnHand: number }>;
  movements: Array<{
    id: string;
    warehouseName: string;
    quantity_delta: number;
    reason: string;
    reference: string | null;
    created_by_name: string | null;
    created_at: string;
  }>;
  unitsSold: number;
  revenue: number;
}

export async function getProductDetail(
  supabase: SupabaseClient,
  orgId: string,
  productId: string
): Promise<ProductDetail | null> {
  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, description, unit_of_measure, cost_price, selling_price, reorder_level, barcode, is_active, created_at, product_categories(name)"
    )
    .eq("org_id", orgId)
    .eq("id", productId)
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;

  const [
    { data: levels, error: levelsError },
    { data: movements, error: movementsError },
    { data: soldItems, error: soldError },
  ] = await Promise.all([
    supabase
      .from("stock_levels")
      .select("warehouse_id, quantity_on_hand, warehouses(name, branches(name))")
      .eq("org_id", orgId)
      .eq("product_id", productId),
    supabase
      .from("stock_movements")
      .select("id, warehouse_id, quantity_delta, reason, reference, created_at, warehouses(name), profiles(full_name)")
      .eq("org_id", orgId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("sales_invoice_items")
      .select("quantity, line_total, sales_invoices!inner(org_id, status)")
      .eq("product_id", productId)
      .eq("sales_invoices.org_id", orgId)
      .in("sales_invoices.status", ["issued", "partially_paid", "paid"]),
  ]);

  if (levelsError) throw levelsError;
  if (movementsError) throw movementsError;
  if (soldError) throw soldError;

  const levelRows = (levels ?? []) as unknown as Array<{
    warehouse_id: string;
    quantity_on_hand: number;
    warehouses: { name: string; branches: { name: string } | null } | null;
  }>;

  const movementRows = (movements ?? []) as unknown as Array<{
    id: string;
    quantity_delta: number;
    reason: string;
    reference: string | null;
    created_at: string;
    warehouses: { name: string } | null;
    profiles: { full_name: string | null } | null;
  }>;

  const soldRows = (soldItems ?? []) as unknown as Array<{ quantity: number; line_total: number }>;

  const p = product as unknown as {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    unit_of_measure: string;
    cost_price: number;
    selling_price: number;
    reorder_level: number;
    barcode: string | null;
    is_active: boolean;
    created_at: string;
    product_categories: { name: string } | null;
  };

  const totalStock = levelRows.reduce((sum, l) => sum + l.quantity_on_hand, 0);

  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    categoryName: p.product_categories?.name ?? null,
    unit_of_measure: p.unit_of_measure,
    cost_price: p.cost_price,
    selling_price: p.selling_price,
    reorder_level: p.reorder_level,
    barcode: p.barcode,
    is_active: p.is_active,
    created_at: p.created_at,
    totalStock,
    stockValue: totalStock * p.cost_price,
    stockByWarehouse: levelRows.map((l) => ({
      warehouseId: l.warehouse_id,
      warehouseName: l.warehouses?.name ?? "Warehouse",
      branchName: l.warehouses?.branches?.name ?? "",
      quantityOnHand: l.quantity_on_hand,
    })),
    movements: movementRows.map((m) => ({
      id: m.id,
      warehouseName: m.warehouses?.name ?? "Warehouse",
      quantity_delta: m.quantity_delta,
      reason: m.reason,
      reference: m.reference,
      created_by_name: m.profiles?.full_name ?? null,
      created_at: m.created_at,
    })),
    unitsSold: soldRows.reduce((sum, s) => sum + s.quantity, 0),
    revenue: soldRows.reduce((sum, s) => sum + s.line_total, 0),
  };
}
