"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { connectSocialAccount, createSocialPost, queueSocialPostForPublishing } from "@/services/socialMedia";

export interface SocialMediaActionState {
  error: string | null;
  success: boolean;
}

export const initialSocialMediaActionState: SocialMediaActionState = { error: null, success: false };

export async function connectSocialAccountAction(
  _prev: SocialMediaActionState,
  formData: FormData
): Promise<SocialMediaActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "social_media");

  if (!permissions.has("social_media.manage")) {
    return { error: "You don't have permission to connect social accounts.", success: false };
  }

  const platformKey = String(formData.get("platformKey") ?? "");
  const accountId = String(formData.get("accountId") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();

  if (!platformKey || !accountId || !accountName) {
    return { error: "Platform, account ID, and account name are required.", success: false };
  }

  try {
    await connectSocialAccount(supabase, orgId, { platformKey, accountId, accountName });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/social-media");
  return { error: null, success: true };
}

export async function queueSocialPostAction(
  _prev: SocialMediaActionState,
  formData: FormData
): Promise<SocialMediaActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "social_media");

  if (!permissions.has("social_media.manage")) {
    return { error: "You don't have permission to queue social media posts.", success: false };
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const platforms = formData.getAll("platforms").map(String);

  if (!title || !content || platforms.length === 0) {
    return { error: "Title, content, and at least one platform are required.", success: false };
  }

  try {
    const postId = await createSocialPost(supabase, orgId, { title, content, platforms });
    await queueSocialPostForPublishing(supabase, postId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/social-media");
  return { error: null, success: true };
}
