import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listIbanRequests } from "@/services/iban";
import { NewIbanRequestModal } from "./NewIbanRequestModal";
import { IbanRequestsTable } from "./IbanRequestsTable";

export default async function IbanPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "iban");
  const canManage = permissions.has("iban.manage");

  const requests = await listIbanRequests(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Finance" title="IBAN" />
        {canManage && <NewIbanRequestModal />}
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz cannot mint an IBAN directly - each request is provisioned through a banking partner and stays
        "pending" until QuickBiz staff confirm the real account was issued.
      </p>

      <IbanRequestsTable requests={requests} />
    </div>
  );
}
