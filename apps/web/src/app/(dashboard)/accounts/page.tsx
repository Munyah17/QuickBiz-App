import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listAccounts } from "@/services/finance";
import { AccountsTable } from "./AccountsTable";

export default async function AccountsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");
  const accounts = await listAccounts(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Finance" title="Chart of Accounts" />
      <AccountsTable accounts={accounts} canManage={permissions.has("finance.manage")} />
    </div>
  );
}
