import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listOpportunities } from "@/services/crm";
import { listCustomers } from "@/services/customers";
import { NewOpportunityModal } from "./NewOpportunityModal";
import { OpportunitiesTable } from "./OpportunitiesTable";

export default async function OpportunitiesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");
  const canManage = permissions.has("crm.manage");

  const [opportunities, customers] = await Promise.all([listOpportunities(supabase, orgId), listCustomers(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="CRM" title="Opportunities" />
        {canManage && <NewOpportunityModal customers={customers.filter((c) => c.is_active)} />}
      </div>

      <OpportunitiesTable opportunities={opportunities} canManage={canManage} />
    </div>
  );
}
