import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listDistributionRoutes } from "@/services/logistics";
import { listVehicles } from "@/services/fleet";
import { listEmployees } from "@/services/hr";
import { DistributionClient } from "./DistributionClient";

export default async function DistributionPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");
  const canManage = permissions.has("logistics.manage");

  let routes: Awaited<ReturnType<typeof listDistributionRoutes>> = [];
  let vehicles: Array<{ id: string; registration_number: string }> = [];
  let employees: Array<{ id: string; full_name: string }> = [];
  let provisionError: string | null = null;
  try {
    [routes, vehicles, employees] = await Promise.all([
      listDistributionRoutes(supabase, orgId),
      listVehicles(supabase, orgId).then((r) => r.map((v) => ({ id: v.id, registration_number: (v as { registration_number?: string }).registration_number ?? v.id }))),
      listEmployees(supabase, orgId).then((r) => r.map((e) => ({ id: e.id, full_name: (e as { full_name?: string }).full_name ?? e.id }))),
    ]);
  } catch (e) {
    provisionError = (e as Error).message;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Logistics" title="Distribution" />
      <DistributionClient routes={routes} vehicles={vehicles} employees={employees} canManage={canManage} provisionError={provisionError} />
    </div>
  );
}
