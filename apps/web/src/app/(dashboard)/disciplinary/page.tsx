import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled, requirePermission } from "@/lib/session";
import { listDisciplinaryCases, listDisciplinaryHearings, listDisciplinaryWarnings } from "@/services/disciplinary";
import { listEmployees } from "@/services/hr";
import { CasesTable } from "./CasesTable";
import { HearingsTable } from "./HearingsTable";
import { WarningsTable } from "./WarningsTable";

export default async function DisciplinaryPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");
  requirePermission(permissions, "disciplinary.view");

  const canManage = permissions.has("disciplinary.manage");

  const [cases, hearings, warnings, employees] = await Promise.all([
    listDisciplinaryCases(supabase, orgId),
    listDisciplinaryHearings(supabase, orgId),
    listDisciplinaryWarnings(supabase, orgId),
    listEmployees(supabase, orgId),
  ]);

  const employeeOptions = employees.map((e) => ({ id: e.id, fullName: e.full_name }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Disciplinary" />

      <p className="text-sm text-text-tertiary">
        Track employee disciplinary cases from the initial violation through hearings, actions taken, and any
        warnings issued. These records are visible only to holders of the Disciplinary view permission.
      </p>

      <CasesTable cases={cases} employees={employeeOptions} canManage={canManage} />
      <HearingsTable hearings={hearings} canManage={canManage} />
      <WarningsTable warnings={warnings} employees={employeeOptions} canManage={canManage} />
    </div>
  );
}
