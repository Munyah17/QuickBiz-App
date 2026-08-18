import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listSuppliers } from "@/services/purchasing";
import { SuppliersTable } from "./SuppliersTable";

export default async function SuppliersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");
  const suppliers = await listSuppliers(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suppliers" />
      <SuppliersTable suppliers={suppliers} canManage={permissions.has("purchasing.manage")} />
    </div>
  );
}
