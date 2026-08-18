"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createCampaign, updateCampaignStatus, type CampaignInput } from "@/services/marketing";

export interface CampaignActionState {
  error: string | null;
  success: boolean;
}

export const initialCampaignActionState: CampaignActionState = { error: null, success: false };

export async function createCampaignAction(_prev: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "marketing");

  if (!permissions.has("marketing.manage")) {
    return { error: "You don't have permission to create campaigns.", success: false };
  }

  const input: CampaignInput = {
    name: String(formData.get("name") ?? "").trim(),
    channel: String(formData.get("channel") ?? "other"),
    message: String(formData.get("message") ?? "").trim(),
    targetSegment: String(formData.get("targetSegment") ?? "").trim(),
    branchId: String(formData.get("branchId") ?? ""),
    scheduledAt: String(formData.get("scheduledAt") ?? ""),
  };

  if (!input.name) return { error: "Campaign name is required.", success: false };
  if (!input.message) return { error: "Message is required.", success: false };

  try {
    await createCampaign(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/campaigns");
  return { error: null, success: true };
}

export async function updateCampaignStatusAction(
  _prev: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("marketing.manage")) {
    return { error: "You don't have permission to update this campaign.", success: false };
  }

  const campaignId = String(formData.get("campaignId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateCampaignStatus(supabase, campaignId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/campaigns");
  return { error: null, success: true };
}
