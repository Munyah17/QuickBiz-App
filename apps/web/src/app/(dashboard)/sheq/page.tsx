import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listSheqIncidents, listSheqInspections } from "@/services/sheq";
import { IncidentsTable } from "./IncidentsTable";
import { InspectionsTable } from "./InspectionsTable";

export default async function SheqPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  const canManage = permissions.has("sheq.manage");
  const canAudit = permissions.has("sheq.audit");

  const [incidents, inspections] = await Promise.all([
    listSheqIncidents(supabase, orgId),
    listSheqInspections(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="SHEQ" />

      <p className="text-sm text-text-tertiary">
        Report safety, health, environment, and quality incidents, conduct inspections and audits, and track
        corrective and preventive actions through to closure.
      </p>

      <IncidentsTable incidents={incidents} canManage={canManage} />
      <InspectionsTable inspections={inspections} canAudit={canAudit} />
    </div>
  );
}
