import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext } from "@/lib/session";
import { listCustomers } from "@/services/customers";
import { CustomersTable } from "./CustomersTable";

export default async function CustomersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const customers = await listCustomers(supabase, orgId);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;
  const businessCustomers = customers.filter((c) => c.customer_type === "business").length;
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgo = thirtyDaysAgoDate.toISOString();
  const newThisMonth = customers.filter((c) => c.created_at >= thirtyDaysAgo).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={totalCustomers.toString()} tone="primary" />
        <StatCard label="Active" value={activeCustomers.toString()} tone="success" />
        <StatCard label="Business accounts" value={businessCustomers.toString()} tone="info" />
        <StatCard label="New in last 30 days" value={newThisMonth.toString()} tone="warning" />
      </div>

      <CustomersTable customers={customers} canManage={permissions.has("customers.manage")} />
    </div>
  );
}
