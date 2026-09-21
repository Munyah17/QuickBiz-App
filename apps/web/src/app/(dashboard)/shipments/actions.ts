"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createShipment, updateShipmentStatus, addShipmentEvent, type ShipmentInput } from "@/services/logistics";

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
    originAddress: String(formData.get("originAddress") ?? "").trim(),
    deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim(),
    routeDescription: String(formData.get("routeDescription") ?? "").trim(),
    eta: String(formData.get("eta") ?? "").trim(),
    priority: String(formData.get("priority") ?? "normal").trim(),
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
  const location = String(formData.get("location") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  try {
    await updateShipmentStatus(supabase, shipmentId, status, { location, note });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/shipments");
  return { error: null, success: true };
}

export async function addShipmentEventAction(
  _prev: ShipmentActionState,
  formData: FormData
): Promise<ShipmentActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to update this shipment.", success: false };
  }

  const shipmentId = String(formData.get("shipmentId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!status) return { error: "A status is required for a tracking event.", success: false };

  try {
    await addShipmentEvent(supabase, shipmentId, { status, location, note });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/shipments");
  return { error: null, success: true };
}

export async function bulkSetShipmentStatusAction(shipmentIds: string[], status: string): Promise<ShipmentActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("logistics.manage")) {
    return { error: "You don't have permission to update shipments.", success: false };
  }
  if (shipmentIds.length === 0) return { error: "No shipments selected.", success: false };

  try {
    await Promise.all(shipmentIds.map((id) => updateShipmentStatus(supabase, id, status)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/shipments");
  return { error: null, success: true };
}
