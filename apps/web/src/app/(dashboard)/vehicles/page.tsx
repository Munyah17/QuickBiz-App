import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listVehicles } from "@/services/fleet";
import { listBranches } from "@/services/branches";
import { listEmployees } from "@/services/hr";
import { NewVehicleModal } from "./NewVehicleModal";
import { VehiclesTable } from "./VehiclesTable";

export default async function VehiclesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "fleet");
  const canManage = permissions.has("fleet.manage");

  const [vehicles, branches, employees] = await Promise.all([
    listVehicles(supabase, orgId),
    listBranches(supabase, orgId),
    listEmployees(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Fleet" />
        {canManage && (
          <NewVehicleModal
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            employees={employees.map((e) => ({ id: e.id, full_name: e.full_name }))}
          />
        )}
      </div>

      <VehiclesTable vehicles={vehicles} canManage={canManage} />
    </div>
  );
}
