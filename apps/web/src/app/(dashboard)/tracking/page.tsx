import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listShipments, listShipmentEvents, type ShipmentEvent } from "@/services/logistics";
import { TrackingClient } from "./TrackingClient";

export default async function TrackingPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");

  const shipments = await listShipments(supabase, orgId);
  const active = shipments.filter((s) => s.status === "dispatched" || s.status === "in_transit");

  const eventPairs = await Promise.all(
    active.map(async (s) => [s.id, await listShipmentEvents(supabase, s.id)] as const)
  );
  const eventsByShipment: Record<string, ShipmentEvent[]> = Object.fromEntries(eventPairs);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Logistics" title="Live Tracking" />
      <TrackingClient shipments={active} eventsByShipment={eventsByShipment} canManage={permissions.has("logistics.manage")} />
    </div>
  );
}
