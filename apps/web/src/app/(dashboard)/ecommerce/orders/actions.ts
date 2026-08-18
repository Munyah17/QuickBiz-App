"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createOnlineOrder, updateOnlineOrderStatus, updateOnlineOrderDeliveryStatus, type OnlineOrderItemInput } from "@/services/ecommerce";

export interface OnlineOrderActionState {
  error: string | null;
  success: boolean;
}

export const initialOnlineOrderActionState: OnlineOrderActionState = { error: null, success: false };

export async function createOnlineOrderAction(
  _prev: OnlineOrderActionState,
  formData: FormData
): Promise<OnlineOrderActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "ecommerce");

  if (!permissions.has("ecommerce.manage")) {
    return { error: "You don't have permission to create online orders.", success: false };
  }

  const branchId = String(formData.get("branchId") ?? "");
  if (!branchId) return { error: "No branch found for your account.", success: false };

  const customerId = String(formData.get("customerId") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();
  if (!customerId && !guestName) {
    return { error: "Choose a customer or enter a guest name.", success: false };
  }

  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(Number);
  const unitPrices = formData.getAll("unitPrice").map(Number);
  const items: OnlineOrderItemInput[] = productIds
    .map((productId, i) => ({ productId, quantity: quantities[i] ?? 0, unitPrice: unitPrices[i] ?? 0 }))
    .filter((i) => i.productId && i.quantity > 0);

  if (items.length === 0) {
    return { error: "Add at least one line item.", success: false };
  }

  try {
    await createOnlineOrder(supabase, orgId, {
      customerId,
      guestName,
      guestPhone: String(formData.get("guestPhone") ?? "").trim(),
      branchId,
      warehouseId: String(formData.get("warehouseId") ?? ""),
      deliveryMethod: String(formData.get("deliveryMethod") ?? "pickup"),
      deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      items,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/ecommerce/orders");
  return { error: null, success: true };
}

export async function updateOnlineOrderStatusAction(
  _prev: OnlineOrderActionState,
  formData: FormData
): Promise<OnlineOrderActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("ecommerce.manage")) {
    return { error: "You don't have permission to update this order.", success: false };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateOnlineOrderStatus(supabase, orderId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/ecommerce/orders");
  return { error: null, success: true };
}

export async function updateOnlineOrderDeliveryStatusAction(
  _prev: OnlineOrderActionState,
  formData: FormData
): Promise<OnlineOrderActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("ecommerce.manage")) {
    return { error: "You don't have permission to update this order.", success: false };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const deliveryStatus = String(formData.get("deliveryStatus") ?? "");

  try {
    await updateOnlineOrderDeliveryStatus(supabase, orderId, deliveryStatus);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/ecommerce/orders");
  return { error: null, success: true };
}
