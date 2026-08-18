import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Target } from "lucide-react";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listOpportunities } from "@/services/crm";
import { listCustomers } from "@/services/customers";
import { NewOpportunityModal } from "./NewOpportunityModal";
import { StageSelect } from "./StageSelect";

export default async function OpportunitiesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");
  const canManage = permissions.has("crm.manage");

  const [opportunities, customers] = await Promise.all([listOpportunities(supabase, orgId), listCustomers(supabase, orgId)]);
  const openValue = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost").reduce((sum, o) => sum + o.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="CRM" title="Opportunities" />
        {canManage && <NewOpportunityModal customers={customers.filter((c) => c.is_active)} />}
      </div>

      <Card>
        {opportunities.length === 0 ? (
          <EmptyState icon={Target} title="No opportunities yet" description="Track deals as they move through your pipeline." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Value</th>
                  <th className="px-4 py-2.5">Expected close</th>
                  <th className="px-4 py-2.5">Stage</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 font-medium text-text-primary">{o.name}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{o.customerName ?? "No customer"}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${o.value.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {o.expected_close_date ? new Date(o.expected_close_date).toLocaleDateString() : "Not set"}
                    </td>
                    <td className="px-4 py-2.5">
                      {canManage ? (
                        <StageSelect opportunityId={o.id} stage={o.stage} />
                      ) : (
                        <span className="capitalize text-text-secondary">{o.stage}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
              Open pipeline value: ${openValue.toFixed(2)}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
