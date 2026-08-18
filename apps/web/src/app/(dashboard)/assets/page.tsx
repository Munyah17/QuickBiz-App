import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Package } from "lucide-react";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listAssets } from "@/services/assets";
import { listBranches } from "@/services/branches";
import { NewAssetModal } from "./NewAssetModal";
import { MaintenanceModal } from "./MaintenanceModal";
import { StatusSelect } from "./StatusSelect";

export default async function AssetsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "assets");
  const canManage = permissions.has("assets.manage");

  const [assets, branches] = await Promise.all([listAssets(supabase, orgId), listBranches(supabase, orgId)]);
  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Fixed Assets" />
        {canManage && <NewAssetModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />}
      </div>

      <Card>
        {assets.length === 0 ? (
          <EmptyState icon={Package} title="No assets yet" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Asset #</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Branch</th>
                  <th className="px-4 py-2.5">Purchase cost</th>
                  <th className="px-4 py-2.5">Current value</th>
                  <th className="px-4 py-2.5">Status</th>
                  {canManage && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 font-mono text-text-secondary">{asset.asset_number}</td>
                    <td className="px-4 py-2.5 font-medium text-text-primary">{asset.name}</td>
                    <td className="px-4 py-2.5 capitalize text-text-secondary">{asset.category}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{asset.branchName ?? "No branch"}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${asset.purchase_cost.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${asset.currentValue.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      {canManage ? (
                        <StatusSelect assetId={asset.id} status={asset.status} />
                      ) : (
                        <span className="capitalize text-text-secondary">{asset.status.replace("_", " ")}</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2.5 text-right">
                        <MaintenanceModal assetId={asset.id} assetName={asset.name} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
              Total current value: ${totalValue.toFixed(2)}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
