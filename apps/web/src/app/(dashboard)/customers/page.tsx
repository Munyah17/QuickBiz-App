import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext } from "@/lib/session";
import { listCustomers } from "@/services/customers";
import { CustomersTable } from "./CustomersTable";

export default async function CustomersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const customers = await listCustomers(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" />
      <CustomersTable customers={customers} canManage={permissions.has("customers.manage")} />
    </div>
  );
}
