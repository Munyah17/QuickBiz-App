import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listSuppliers } from "@/services/purchasing";
import { SuppliersTable } from "./SuppliersTable";

export default async function SuppliersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");
  const suppliers = await listSuppliers(supabase, orgId);

  // Calculate statistics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const inactiveSuppliers = suppliers.filter(s => !s.is_active).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suppliers" />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Suppliers"
          value={totalSuppliers.toString()}
          tone="primary"
        />
        <StatCard
          label="Active"
          value={activeSuppliers.toString()}
          tone="success"
        />
        <StatCard
          label="Inactive"
          value={inactiveSuppliers.toString()}
          tone="warning"
        />
        <StatCard
          label="Coverage"
          value={`${Math.round((activeSuppliers / (totalSuppliers || 1)) * 100)}%`}
          tone="info"
        />
      </div>

      <SuppliersTable suppliers={suppliers} canManage={permissions.has("purchasing.manage")} />
    </div>
  );
}
