"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  startNewStockTake,
  listStockTakeLines,
  recordStockTakeCount,
  completeStockTake,
  approveStockTake,
  type StockTakeLineRow,
} from "@/services/stockTake";

export interface StockTakeActionState {
  error: string | null;
  success: boolean;
}

export const initialStockTakeActionState: StockTakeActionState = { error: null, success: false };

export async function listStockTakeLinesAction(stockTakeId: string): Promise<StockTakeLineRow[]> {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");
  return listStockTakeLines(supabase, stockTakeId);
}

export async function createStockTakeAction(
  _prev: StockTakeActionState,
  formData: FormData
): Promise<StockTakeActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  if (!permissions.has("stock_take.manage")) {
    return { error: "You don't have permission to create stock takes.", success: false };
  }

  const title = String(formData.get("title") ?? "").trim();
  const scheduledDate = String(formData.get("scheduledDate") ?? "");
  const countType = String(formData.get("countType") ?? "full");
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !scheduledDate) {
    return { error: "Title and scheduled date are required.", success: false };
  }

  try {
    await startNewStockTake(supabase, orgId, { title, scheduledDate, countType, description });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/stock-take");
  return { error: null, success: true };
}

export async function recordStockTakeCountAction(stockTakeLineId: string, countedQuantity: number): Promise<void> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  if (!permissions.has("stock_take.execute")) {
    throw new Error("You don't have permission to record counts.");
  }

  await recordStockTakeCount(supabase, stockTakeLineId, countedQuantity);
  revalidatePath("/stock-take");
}

export async function completeStockTakeAction(stockTakeId: string): Promise<void> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  if (!permissions.has("stock_take.execute")) {
    throw new Error("You don't have permission to complete stock takes.");
  }

  await completeStockTake(supabase, stockTakeId);
  revalidatePath("/stock-take");
}

export async function approveStockTakeAction(stockTakeId: string): Promise<void> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  if (!permissions.has("stock_take.approve")) {
    throw new Error("You don't have permission to approve stock takes.");
  }

  await approveStockTake(supabase, stockTakeId);
  revalidatePath("/stock-take");
}
