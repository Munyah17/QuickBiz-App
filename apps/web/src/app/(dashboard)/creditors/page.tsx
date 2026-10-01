import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getAPAging } from "@/services/purchasing";
import { CreditorsClient, type CreditorDoc } from "./CreditorsClient";

export default async function CreditorsPage() {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  const [aging, { data: openDocs }] = await Promise.all([
    getAPAging(supabase, orgId),
    supabase
      .from("purchase_orders")
      .select("id, po_number, supplier_id, status, total, amount_paid, expected_date, created_at")
      .eq("org_id", orgId)
      .in("status", ["issued", "received"])
      .order("expected_date", { ascending: true }),
  ]);

  const docs = ((openDocs ?? []) as unknown as CreditorDoc[]).filter(
    (d) => d.total - d.amount_paid > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Finance" title="Creditors" />
      <CreditorsClient aging={aging} docs={docs} />
    </div>
  );
}
