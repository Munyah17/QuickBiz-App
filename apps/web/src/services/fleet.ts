import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface VehicleRow {
  id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: "active" | "in_maintenance" | "inactive";
  odometer_km: number;
  insurance_expiry: string | null;
  branchName: string | null;
  driverName: string | null;
}

export async function listVehicles(supabase: SupabaseClient, orgId: string): Promise<VehicleRow[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, registration_number, make, model, year, status, odometer_km, insurance_expiry, branches(name), employees(full_name)"
    )
    .eq("org_id", orgId)
    .order("registration_number");
  if (error) throw error;

  return (
    data as unknown as Array<
      Omit<VehicleRow, "branchName" | "driverName"> & { branches: { name: string } | null; employees: { full_name: string } | null }
    >
  ).map((row) => ({
    ...row,
    branchName: row.branches?.name ?? null,
    driverName: row.employees?.full_name ?? null,
  }));
}

export interface VehicleInput {
  branchId: string;
  driverId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number | null;
  odometerKm: number;
  insuranceExpiry: string;
  licenseExpiry: string;
}

export async function createVehicle(supabase: SupabaseClient, orgId: string, input: VehicleInput) {
  const { error } = await supabase.from("vehicles").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    driver_id: input.driverId || null,
    registration_number: input.registrationNumber,
    make: input.make || null,
    model: input.model || null,
    year: input.year,
    odometer_km: input.odometerKm,
    insurance_expiry: input.insuranceExpiry || null,
    license_expiry: input.licenseExpiry || null,
  });
  if (error) throw error;
}

export async function updateVehicleStatus(supabase: SupabaseClient, vehicleId: string, status: string) {
  const { error } = await supabase.from("vehicles").update({ status }).eq("id", vehicleId);
  if (error) throw error;
}

export async function logFuel(
  supabase: SupabaseClient,
  orgId: string,
  vehicleId: string,
  input: { liters: number; cost: number; odometerKm: number | null; fuelDate: string }
) {
  const { error: fuelError } = await supabase.from("fuel_logs").insert({
    org_id: orgId,
    vehicle_id: vehicleId,
    liters: input.liters,
    cost: input.cost,
    odometer_km: input.odometerKm,
    fuel_date: input.fuelDate || new Date().toISOString().slice(0, 10),
  });
  if (fuelError) throw fuelError;

  if (input.odometerKm !== null) {
    const { error: odoError } = await supabase.from("vehicles").update({ odometer_km: input.odometerKm }).eq("id", vehicleId);
    if (odoError) throw odoError;
  }
}
