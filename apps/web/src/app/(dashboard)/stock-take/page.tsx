import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listStockTakes } from "@/services/stockTake";
import { NewStockTakeModal } from "./NewStockTakeModal";
import { StockTakesTable } from "./StockTakesTable";

export default async function StockTakePage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  const canManage = permissions.has("stock_take.manage");
  const canExecute = permissions.has("stock_take.execute");
  const canApprove = permissions.has("stock_take.approve");

  const stockTakes = await listStockTakes(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Operations" title="Stock Take" />
        {canManage && <NewStockTakeModal />}
      </div>

      <p className="text-sm text-text-tertiary">
        Run periodic physical inventory counts, record counted quantities against system quantities, and resolve variances.
      </p>

      <StockTakesTable stockTakes={stockTakes} canExecute={canExecute} canApprove={canApprove} />
    </div>
  );
}
