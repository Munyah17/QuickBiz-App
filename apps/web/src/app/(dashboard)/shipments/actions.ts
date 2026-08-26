"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createShipment, updateShipmentStatus, type ShipmentInput } from "@/services/logistics";

export interface ShipmentActionState {
  error: string | null;
  success: boolean;
}

export const initialShipmentActionState: ShipmentActionState = { error: null, success: false };

export async function createShipmentAction(_prev: ShipmentActionState, formData: FormData): Promise<ShipmentActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");

  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to create shipments.", success: false };
  }

  const input: ShipmentInput = {
    branchId: String(formData.get("branchId") ?? ""),
    customerId: String(formData.get("customerId") ?? ""),
    salesInvoiceId: String(formData.get("salesInvoiceId") ?? ""),
    onlineOrderId: String(formData.get("onlineOrderId") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    driverId: String(formData.get("driverId") ?? ""),
    carrier: String(formData.get("carrier") ?? "").trim(),
    trackingNumber: String(formData.get("trackingNumber") ?? "").trim(),
    deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  try {
    await createShipment(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/shipments");
  return { error: null, success: true };
}

export async function updateShipmentStatusAction(
  _prev: ShipmentActionState,
  formData: FormData
): Promise<ShipmentActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to update this shipment.", success: false };
  }

  const shipmentId = String(formData.get("shipmentId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateShipmentStatus(supabase, shipmentId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/shipments");
  return { error: null, success: true };
}
