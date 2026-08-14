import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext } from "@/lib/session";
import { listBranches } from "@/services/branches";
import { BranchesTable } from "./BranchesTable";

export default async function BranchesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const branches = await listBranches(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Company" title="Branches" />
      <BranchesTable branches={branches} canManage={permissions.has("branches.manage")} />
    </div>
  );
}
