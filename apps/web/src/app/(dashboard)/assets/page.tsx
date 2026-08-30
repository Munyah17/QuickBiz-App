import { PageHeader } from "@/components/PageHeader";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Fixed Assets" />
        {canManage && <NewAssetModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />}
      </div>

      <AssetsTable assets={assets} canManage={canManage} />
    </div>
  );
}
