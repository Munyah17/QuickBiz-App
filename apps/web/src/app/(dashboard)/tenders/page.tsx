import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listTenders } from "@/services/tenders";
import { listSuppliers } from "@/services/purchasing";
import { NewTenderModal } from "./NewTenderModal";
import { TendersTable } from "./TendersTable";

export default async function TendersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "tender_bidding");
  const canManage = permissions.has("tender_bidding.manage");
  const canBid = permissions.has("tender_bidding.bid");
  const canEvaluate = permissions.has("tender_bidding.evaluate");

  const [tenders, suppliers] = await Promise.all([listTenders(supabase, orgId), listSuppliers(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Operations" title="Tenders" />
        {canManage && <NewTenderModal />}
      </div>

      <p className="text-sm text-text-tertiary">
        Track tenders you are running to source suppliers, receive and evaluate bids, and award the winning bid.
      </p>

      <TendersTable tenders={tenders} suppliers={suppliers} canBid={canBid} canEvaluate={canEvaluate} />
    </div>
  );
}
