import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getARAging } from "@/services/sales";
import { DebtorsClient, type DebtorInvoice } from "./DebtorsClient";

export default async function DebtorsPage() {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  const [aging, { data: openDocs }] = await Promise.all([
    getARAging(supabase, orgId),
    supabase
      .from("sales_invoices")
      .select("id, invoice_number, customer_id, status, total, amount_paid, due_date, created_at")
      .eq("org_id", orgId)
      .in("doc_type", ["invoice", "debit_note"])
      .in("status", ["issued", "partially_paid"])
      .order("due_date", { ascending: true }),
  ]);

  const invoices = ((openDocs ?? []) as unknown as DebtorInvoice[]).filter(
    (i) => i.total - i.amount_paid > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Finance" title="Debtors" />
      <DebtorsClient aging={aging} invoices={invoices} />
    </div>
  );
}
