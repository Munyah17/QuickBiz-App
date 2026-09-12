import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listWarehouses, listWarehouseZones, listWarehouseBins } from "@/services/warehousing";
import { WarehousesTable } from "./WarehousesTable";
import { ZonesTable } from "./ZonesTable";
import { BinsTable } from "./BinsTable";

export default async function WarehousingPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "warehousing");

  const canManage = permissions.has("warehousing.manage");

  const [warehouses, zones, bins] = await Promise.all([
    listWarehouses(supabase, orgId),
    listWarehouseZones(supabase, orgId),
    listWarehouseBins(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Warehousing" />

      <p className="text-sm text-text-tertiary">
        Manage warehouses, storage zones, and bins, and track exactly where stock sits inside each site.
      </p>

      <WarehousesTable warehouses={warehouses} canManage={canManage} />
      <ZonesTable zones={zones} warehouses={warehouses} canManage={canManage} />
      <BinsTable bins={bins} zones={zones} canManage={canManage} />
    </div>
  );
}
