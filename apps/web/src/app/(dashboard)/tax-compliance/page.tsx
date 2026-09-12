import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listTaxFilings, listTaxTypes } from "@/services/taxCompliance";
import { NewTaxFilingModal } from "./NewTaxFilingModal";
import { TaxFilingsTable } from "./TaxFilingsTable";

export default async function TaxCompliancePage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "tax_compliance");
  const canManage = permissions.has("tax_compliance.manage");
  const canFile = permissions.has("tax_compliance.file");

  const [filings, taxTypes] = await Promise.all([listTaxFilings(supabase, orgId), listTaxTypes(supabase)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Finance" title="Tax Compliance" />
        {canManage && <NewTaxFilingModal taxTypes={taxTypes} />}
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz tracks your tax filing obligations and deadlines - it does not file with ZIMRA on your behalf.
        "Mark as Filed" records that you submitted the return through ZIMRA's own e-Services/FDMS, not an actual
        submission made by QuickBiz. Due days shown are a verified starting point - VAT due dates vary by taxpayer
        category (A/B/C), so always confirm against current ZIMRA notices.
      </p>

      <TaxFilingsTable filings={filings} canFile={canFile} />
    </div>
  );
}
