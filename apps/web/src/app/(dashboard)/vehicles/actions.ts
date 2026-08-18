"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createVehicle, updateVehicleStatus, logFuel, type VehicleInput } from "@/services/fleet";

export interface VehicleActionState {
  error: string | null;
  success: boolean;
}

export const initialVehicleActionState: VehicleActionState = { error: null, success: false };

export async function createVehicleAction(_prev: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "fleet");

  if (!permissions.has("fleet.manage")) {
    return { error: "You don't have permission to manage vehicles.", success: false };
  }

  const yearRaw = String(formData.get("year") ?? "").trim();
  const input: VehicleInput = {
    branchId: String(formData.get("branchId") ?? ""),
    driverId: String(formData.get("driverId") ?? ""),
    registrationNumber: String(formData.get("registrationNumber") ?? "").trim(),
    make: String(formData.get("make") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    year: yearRaw ? Number(yearRaw) : null,
    odometerKm: Number(formData.get("odometerKm") ?? 0),
    insuranceExpiry: String(formData.get("insuranceExpiry") ?? ""),
    licenseExpiry: String(formData.get("licenseExpiry") ?? ""),
  };

  if (!input.registrationNumber) return { error: "Registration number is required.", success: false };

  try {
    await createVehicle(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/vehicles");
  return { error: null, success: true };
}

export async function updateVehicleStatusAction(_prev: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("fleet.manage")) {
    return { error: "You don't have permission to update vehicles.", success: false };
  }

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateVehicleStatus(supabase, vehicleId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/vehicles");
  return { error: null, success: true };
}

export async function logFuelAction(_prev: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("fleet.manage")) {
    return { error: "You don't have permission to log fuel.", success: false };
  }

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const liters = Number(formData.get("liters") ?? 0);
  const cost = Number(formData.get("cost") ?? 0);
  const odometerRaw = String(formData.get("odometerKm") ?? "").trim();
  const fuelDate = String(formData.get("fuelDate") ?? "");

  if (liters <= 0) return { error: "Liters must be greater than zero.", success: false };

  try {
    await logFuel(supabase, orgId, vehicleId, { liters, cost, odometerKm: odometerRaw ? Number(odometerRaw) : null, fuelDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/vehicles");
  return { error: null, success: true };
}
