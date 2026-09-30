import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listFiscalDevices, listFiscalReceipts, listVatReturns } from "@/services/fiscalisation";
import { listBranches } from "@/services/branches";
import { FiscalisationClient } from "./FiscalisationClient";

export default async function FiscalisationPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  const canManage = permissions.has("finance.manage");

  let devices: Awaited<ReturnType<typeof listFiscalDevices>> = [];
  let receipts: Awaited<ReturnType<typeof listFiscalReceipts>> = [];
  let vatReturns: Awaited<ReturnType<typeof listVatReturns>> = [];
  let branches: Awaited<ReturnType<typeof listBranches>> = [];
  let invoices: Array<{ id: string; invoice_number: string }> = [];
  let provisionError: string | null = null;
  try {
    [devices, receipts, vatReturns, branches, invoices] = await Promise.all([
      listFiscalDevices(supabase, orgId),
      listFiscalReceipts(supabase, orgId),
      listVatReturns(supabase, orgId),
      listBranches(supabase, orgId),
      supabase
        .from("sales_invoices")
        .select("id, invoice_number")
        .eq("org_id", orgId)
        .order("invoice_number", { ascending: false })
        .limit(200)
        .then((r) => (r.data ?? []) as Array<{ id: string; invoice_number: string }>),
    ]);
  } catch (e) {
    provisionError = (e as Error).message;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Finance" title="ZIMRA Fiscalisation" />
      <FiscalisationClient
        devices={devices}
        receipts={receipts}
        vatReturns={vatReturns}
        branches={branches}
        invoices={invoices}
        canManage={canManage}
        provisionError={provisionError}
      />
    </div>
  );
}
