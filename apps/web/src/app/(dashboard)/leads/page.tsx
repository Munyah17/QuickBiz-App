import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listLeads } from "@/services/crm";
import { LeadsTable } from "./LeadsTable";

export default async function LeadsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");
  const leads = await listLeads(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="CRM" title="Leads" />
      <LeadsTable leads={leads} canManage={permissions.has("crm.manage")} />
    </div>
  );
}
