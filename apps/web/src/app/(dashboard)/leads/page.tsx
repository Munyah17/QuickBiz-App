import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listLeads } from "@/services/crm";
import { LeadsTable } from "./LeadsTable";

export default async function LeadsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");
  const leads = await listLeads(supabase, orgId);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const qualifiedLeads = leads.filter((l) => l.status === "qualified").length;
  const convertedLeads = leads.filter((l) => l.status === "converted").length;

  const statusBreakdown = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSegments = Object.entries(statusBreakdown)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="CRM" title="Leads" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={totalLeads.toString()} tone="primary" />
        <StatCard label="New" value={newLeads.toString()} tone="warning" />
        <StatCard label="Qualified" value={qualifiedLeads.toString()} tone="info" />
        <StatCard label="Converted" value={convertedLeads.toString()} tone="success" />
      </div>

      {statusSegments.length > 0 && (
        <Card>
          <CardHeader title="Leads by status" />
          <div className="p-4">
            <BreakdownBarChart segments={statusSegments} />
          </div>
        </Card>
      )}

      <LeadsTable leads={leads} canManage={permissions.has("crm.manage")} />
    </div>
  );
}
