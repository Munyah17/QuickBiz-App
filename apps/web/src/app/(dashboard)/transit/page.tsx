import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listShipments } from "@/services/logistics";
import { TransitClient } from "./TransitClient";

export default async function TransitPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");

  const shipments = await listShipments(supabase, orgId);
  const inTransit = shipments.filter((s) => s.status !== "delivered" && s.status !== "returned" && s.status !== "failed");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Logistics" title="Transit" />
      <TransitClient shipments={inTransit} canManage={permissions.has("logistics.manage")} />
    </div>
  );
}
