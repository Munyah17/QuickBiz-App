import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listWarehouses, listWarehouseZones, listWarehouseBins, listTransfers } from "@/services/warehousing";
import { listProductsWithStock } from "@/services/products";
import { WarehousesTable } from "./WarehousesTable";
import { ZonesTable } from "./ZonesTable";
import { BinsTable } from "./BinsTable";
import { TransfersTable } from "./TransfersTable";

export default async function WarehousingPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "warehousing");

  const canManage = permissions.has("warehousing.manage");
  const canTransfer = permissions.has("warehousing.transfer");

  const [warehouses, zones, bins, transfers, products] = await Promise.all([
    listWarehouses(supabase, orgId),
    listWarehouseZones(supabase, orgId),
    listWarehouseBins(supabase, orgId),
    listTransfers(supabase, orgId),
    listProductsWithStock(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Warehousing" />

      <p className="text-sm text-text-tertiary">
        Manage warehouses, storage zones, and bins, and track exactly where stock sits inside each site.
      </p>

      <TransfersTable transfers={transfers} warehouses={warehouses} products={products} canTransfer={canTransfer} />
      <WarehousesTable warehouses={warehouses} canManage={canManage} />
      <ZonesTable zones={zones} warehouses={warehouses} canManage={canManage} />
      <BinsTable bins={bins} zones={zones} canManage={canManage} />
    </div>
  );
}
