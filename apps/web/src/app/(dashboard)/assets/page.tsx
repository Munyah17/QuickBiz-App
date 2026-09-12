import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listAssets } from "@/services/assets";
import { listBranches } from "@/services/branches";
import { NewAssetModal } from "./NewAssetModal";
import { AssetsTable } from "./AssetsTable";

export default async function AssetsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "assets");
  const canManage = permissions.has("assets.manage");

  const [assets, branches] = await Promise.all([listAssets(supabase, orgId), listBranches(supabase, orgId)]);

  const totalAssets = assets.length;
  const totalPurchaseCost = assets.reduce((sum, a) => sum + a.purchase_cost, 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const inUseAssets = assets.filter((a) => a.status === "in_use").length;

  const categoryBreakdown = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + a.currentValue;
    return acc;
  }, {} as Record<string, number>);

  const categorySegments = Object.entries(categoryBreakdown)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Fixed Assets" />
        {canManage && <NewAssetModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total assets" value={totalAssets.toString()} tone="primary" />
        <StatCard label="Purchase cost" value={`$${totalPurchaseCost.toLocaleString()}`} tone="info" />
        <StatCard label="Current value" value={`$${totalCurrentValue.toLocaleString()}`} tone="success" />
        <StatCard label="In use" value={inUseAssets.toString()} tone="warning" />
      </div>

      {categorySegments.length > 0 && (
        <Card>
          <CardHeader title="Current value by category" />
          <div className="p-4">
            <BreakdownBarChart segments={categorySegments} formatValue={(v) => `$${v.toLocaleString()}`} />
          </div>
        </Card>
      )}

      <AssetsTable assets={assets} canManage={canManage} />
    </div>
  );
}
