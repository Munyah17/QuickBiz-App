import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getPayrollTaxSettings, listSalaryComponents } from "@/services/payroll";
import { TaxSettingsForm } from "./TaxSettingsForm";
import { SalaryComponentsCard } from "./SalaryComponentsCard";

export default async function PayrollSettingsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "payroll");
  if (!permissions.has("payroll.manage")) redirect("/payroll");

  const [taxSettings, components] = await Promise.all([
    getPayrollTaxSettings(supabase, orgId),
    listSalaryComponents(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Payroll" title="Tax Settings" />
      <TaxSettingsForm settings={taxSettings} />
      <SalaryComponentsCard components={components} />
    </div>
  );
}
