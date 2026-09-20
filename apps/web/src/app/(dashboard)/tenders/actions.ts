"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createTender, submitTenderBid, awardTender, listTenderBids, type TenderBidRow } from "@/services/tenders";

export interface TenderActionState {
  error: string | null;
  success: boolean;
}

export const initialTenderActionState: TenderActionState = { error: null, success: false };

export async function listTenderBidsAction(tenderId: string): Promise<TenderBidRow[]> {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  return listTenderBids(supabase, tenderId);
}

export async function createTenderAction(
  _prev: TenderActionState,
  formData: FormData
): Promise<TenderActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");

  if (!permissions.has("tender_bidding.manage")) {
    return { error: "You don't have permission to create tenders.", success: false };
  }

  const tenderNumber = String(formData.get("tenderNumber") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const budget = Number(formData.get("budget"));
  const closingDate = String(formData.get("closingDate") ?? "");

  if (!tenderNumber || !title || !closingDate) {
    return { error: "Tender number, title, and closing date are required.", success: false };
  }

  try {
    await createTender(supabase, orgId, { tenderNumber, title, description, category, budget, closingDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tenders");
  return { error: null, success: true };
}

export async function submitTenderBidAction(
  _prev: TenderActionState,
  formData: FormData
): Promise<TenderActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");

  if (!permissions.has("tender_bidding.bid")) {
    return { error: "You don't have permission to submit bids.", success: false };
  }

  const tenderId = String(formData.get("tenderId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "");
  const amount = Number(formData.get("amount"));

  if (!tenderId || !supplierId || !amount) {
    return { error: "Supplier and amount are required.", success: false };
  }

  try {
    await submitTenderBid(supabase, tenderId, supplierId, amount);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tenders");
  return { error: null, success: true };
}

export async function awardTenderAction(
  _prev: TenderActionState,
  formData: FormData
): Promise<TenderActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");

  if (!permissions.has("tender_bidding.evaluate")) {
    return { error: "You don't have permission to award tenders.", success: false };
  }

  const tenderId = String(formData.get("tenderId") ?? "");
  const bidId = String(formData.get("bidId") ?? "");
  const awardAmount = Number(formData.get("awardAmount"));

  if (!tenderId || !bidId || !awardAmount) {
    return { error: "Award amount is required.", success: false };
  }

  try {
    await awardTender(supabase, tenderId, bidId, awardAmount);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tenders");
  return { error: null, success: true };
}
