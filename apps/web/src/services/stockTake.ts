import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import { listProductsWithStock } from "./products";

export interface StockTakeRow {
  id: string;
  stockTakeNumber: string;
  title: string;
  scheduledDate: string;
  status: string;
  countType: string;
  totalVarianceValue: number | null;
}

export async function listStockTakes(supabase: SupabaseClient, orgId: string, status?: string): Promise<StockTakeRow[]> {
  const { data, error } = await supabase.rpc("list_stock_takes", { p_org_id: orgId, p_status: status ?? undefined });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      stock_take_number: string;
      title: string;
      scheduled_date: string;
      status: string;
      count_type: string;
      total_variance_value: number | null;
    }>
  ).map((row) => ({
    id: row.id,
    stockTakeNumber: row.stock_take_number,
    title: row.title,
    scheduledDate: row.scheduled_date,
    status: row.status,
    countType: row.count_type,
    totalVarianceValue: row.total_variance_value,
  }));
}

export interface CreateStockTakeInput {
  title: string;
  scheduledDate: string;
  countType: string;
  warehouseId?: string;
  description?: string;
}

export async function createStockTake(supabase: SupabaseClient, orgId: string, input: CreateStockTakeInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_stock_take", {
    p_org_id: orgId,
    p_title: input.title,
    p_scheduled_date: input.scheduledDate,
    p_count_type: input.countType,
    p_warehouse_id: input.warehouseId || undefined,
    p_branch_id: undefined,
    p_description: input.description || undefined,
  });
  if (error) throw error;

  return data as unknown as string;
}

export async function startStockTake(supabase: SupabaseClient, stockTakeId: string): Promise<void> {
  const { error } = await supabase.rpc("start_stock_take", { p_stock_take_id: stockTakeId });
  if (error) throw error;
}

export async function populateStockTakeLinesFromStock(supabase: SupabaseClient, orgId: string, stockTakeId: string): Promise<void> {
  const products = await listProductsWithStock(supabase, orgId);

  await Promise.all(
    products
      .filter((p) => p.is_active)
      .map((p) =>
        supabase.rpc("add_stock_take_line", {
          p_stock_take_id: stockTakeId,
          p_product_name: p.name,
          p_system_quantity: p.totalStock,
          p_product_id: p.id,
          p_warehouse_id: undefined,
          p_bin_id: undefined,
          p_sku_code: p.sku,
          p_unit_cost: p.cost_price,
        })
      )
  );
}

export async function startNewStockTake(supabase: SupabaseClient, orgId: string, input: CreateStockTakeInput): Promise<string> {
  const stockTakeId = await createStockTake(supabase, orgId, input);
  await startStockTake(supabase, stockTakeId);
  await populateStockTakeLinesFromStock(supabase, orgId, stockTakeId);
  return stockTakeId;
}

export interface StockTakeLineRow {
  id: string;
  productId: string | null;
  productName: string;
  skuCode: string | null;
  systemQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  varianceValue: number | null;
  countStatus: string;
}

export async function listStockTakeLines(supabase: SupabaseClient, stockTakeId: string): Promise<StockTakeLineRow[]> {
  const { data, error } = await supabase
    .from("stock_take_lines")
    .select("id, product_id, product_name, sku_code, system_quantity, counted_quantity, variance, variance_value, count_status")
    .eq("stock_take_id", stockTakeId)
    .order("product_name");
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      product_id: string | null;
      product_name: string;
      sku_code: string | null;
      system_quantity: number;
      counted_quantity: number | null;
      variance: number | null;
      variance_value: number | null;
      count_status: string;
    }>
  ).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    skuCode: row.sku_code,
    systemQuantity: row.system_quantity,
    countedQuantity: row.counted_quantity,
    variance: row.variance,
    varianceValue: row.variance_value,
    countStatus: row.count_status,
  }));
}

export async function recordStockTakeCount(supabase: SupabaseClient, stockTakeLineId: string, countedQuantity: number): Promise<void> {
  const { error } = await supabase.rpc("record_count", { p_stock_take_line_id: stockTakeLineId, p_counted_quantity: countedQuantity });
  if (error) throw error;
}

export async function completeStockTake(supabase: SupabaseClient, stockTakeId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_stock_take", { p_stock_take_id: stockTakeId });
  if (error) throw error;
}

export async function approveStockTake(supabase: SupabaseClient, stockTakeId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_stock_take", { p_stock_take_id: stockTakeId });
  if (error) throw error;
}
