import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listInsurers, listInsurancePolicies, listRiskAssessments } from "@/services/riskInsurance";
import { listAssets } from "@/services/assets";
import { listVehicles } from "@/services/fleet";
import { InsurersTable } from "./InsurersTable";
import { PoliciesTable } from "./PoliciesTable";
import { RiskRegisterTable } from "./RiskRegisterTable";

export default async function RiskInsurancePage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "risk_insurance");

  const canManage = permissions.has("risk_insurance.manage");
  const canClaim = permissions.has("risk_insurance.claims");
  const canAssess = permissions.has("risk_insurance.assess");

  const [insurers, policies, risks, assets, vehicles] = await Promise.all([
    listInsurers(supabase, orgId),
    listInsurancePolicies(supabase, orgId),
    listRiskAssessments(supabase, orgId),
    listAssets(supabase, orgId),
    listVehicles(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Risk & Insurance" />

      <p className="text-sm text-text-tertiary">
        Onboard insurers, track insurance policies covering your assets and operations, process claims, and
        maintain a risk register with mitigation plans.
      </p>

      <InsurersTable insurers={insurers} canManage={canManage} />
      <PoliciesTable
        policies={policies}
        insurers={insurers}
        assets={assets}
        vehicles={vehicles}
        canManage={canManage}
        canClaim={canClaim}
      />
      <RiskRegisterTable risks={risks} canAssess={canAssess} />
    </div>
  );
}
