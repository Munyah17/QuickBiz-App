"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { publishOnlineProduct, setOnlineProductPublished } from "@/services/ecommerce";

export interface OnlineProductActionState {
  error: string | null;
  success: boolean;
}

export const initialOnlineProductActionState: OnlineProductActionState = { error: null, success: false };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function publishOnlineProductAction(
  _prev: OnlineProductActionState,
  formData: FormData
): Promise<OnlineProductActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "ecommerce");

  if (!permissions.has("ecommerce.manage")) {
    return { error: "You don't have permission to manage the online catalog.", success: false };
  }

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Choose a product.", success: false };

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug);
  if (!slug) return { error: "Enter a valid URL slug.", success: false };

  try {
    await publishOnlineProduct(supabase, orgId, {
      productId,
      slug,
      onlinePrice: String(formData.get("onlinePrice") ?? ""),
      isPublished: formData.get("isPublished") === "on",
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/ecommerce/catalog");
  return { error: null, success: true };
}

export async function setOnlineProductPublishedAction(
  _prev: OnlineProductActionState,
  formData: FormData
): Promise<OnlineProductActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("ecommerce.manage")) {
    return { error: "You don't have permission to manage the online catalog.", success: false };
  }

  const onlineProductId = String(formData.get("onlineProductId") ?? "");
  const isPublished = String(formData.get("isPublished") ?? "") === "true";

  try {
    await setOnlineProductPublished(supabase, onlineProductId, !isPublished);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/ecommerce/catalog");
  return { error: null, success: true };
}

export async function bulkSetOnlineProductPublishedAction(
  onlineProductIds: string[],
  isPublished: boolean
): Promise<OnlineProductActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("ecommerce.manage")) {
    return { error: "You don't have permission to manage the online catalog.", success: false };
  }
  if (onlineProductIds.length === 0) return { error: "No products selected.", success: false };

  try {
    await Promise.all(onlineProductIds.map((id) => setOnlineProductPublished(supabase, id, isPublished)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/ecommerce/catalog");
  return { error: null, success: true };
}
