import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listWorkshopJobs } from "@/services/workshop";
import { listWorkOrders } from "@/services/manufacturing";
import { listEmployees } from "@/services/hr";
import { WorkshopClient } from "./WorkshopClient";

export default async function WorkshopPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");
  const canManage = permissions.has("manufacturing.manage");

  let jobs: Awaited<ReturnType<typeof listWorkshopJobs>> = [];
  let workOrders: Array<{ id: string; wo_number: string }> = [];
  let employees: Array<{ id: string; full_name: string }> = [];
  let provisionError: string | null = null;
  try {
    [jobs, workOrders, employees] = await Promise.all([
      listWorkshopJobs(supabase, orgId),
      listWorkOrders(supabase, orgId).then((r) => r.map((w) => ({ id: w.id, wo_number: w.wo_number }))),
      listEmployees(supabase, orgId).then((r) =>
        r.map((e) => ({ id: e.id, full_name: (e as { full_name?: string }).full_name ?? e.id }))
      ),
    ]);
  } catch (e) {
    provisionError = (e as Error).message;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Manufacturing" title="Workshop" />
      <WorkshopClient jobs={jobs} workOrders={workOrders} employees={employees} canManage={canManage} provisionError={provisionError} />
    </div>
  );
}
