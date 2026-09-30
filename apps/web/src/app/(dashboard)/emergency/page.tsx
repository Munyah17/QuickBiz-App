import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listEmergencyIncidents, listShipments } from "@/services/logistics";
import { listVehicles } from "@/services/fleet";
import { EmergencyClient } from "./EmergencyClient";

export default async function EmergencyPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");
  const canManage = permissions.has("logistics.manage");

  let incidents: Awaited<ReturnType<typeof listEmergencyIncidents>> = [];
  let shipments: Array<{ id: string; shipment_number: string }> = [];
  let vehicles: Array<{ id: string; registration_number: string }> = [];
  let provisionError: string | null = null;
  try {
    [incidents, shipments, vehicles] = await Promise.all([
      listEmergencyIncidents(supabase, orgId),
      listShipments(supabase, orgId).then((r) => r.map((s) => ({ id: s.id, shipment_number: s.shipment_number }))),
      listVehicles(supabase, orgId).then((r) => r.map((v) => ({ id: v.id, registration_number: (v as { registration_number?: string }).registration_number ?? v.id }))),
    ]);
  } catch (e) {
    provisionError = (e as Error).message;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Logistics" title="Emergency" />
      <EmergencyClient incidents={incidents} shipments={shipments} vehicles={vehicles} canManage={canManage} provisionError={provisionError} />
    </div>
  );
}
