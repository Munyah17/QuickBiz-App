import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listSuppliers, getAPAging } from "@/services/purchasing";
import { SuppliersTable } from "./SuppliersTable";

export default async function SuppliersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  const [suppliers, apAging] = await Promise.all([listSuppliers(supabase, orgId), getAPAging(supabase, orgId)]);

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

      {apAging.length > 0 && (
        <Card>
          <CardHeader title="Creditors aging — what you owe suppliers" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5 text-right">Current</th>
                <th className="px-4 py-2.5 text-right">1–30 days</th>
                <th className="px-4 py-2.5 text-right">31–60 days</th>
                <th className="px-4 py-2.5 text-right">61–90 days</th>
                <th className="px-4 py-2.5 text-right">90+ days</th>
                <th className="px-4 py-2.5 text-right">Total owed</th>
              </tr>
            </thead>
            <tbody>
              {apAging.map((r) => (
                <tr key={r.supplierId} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{r.supplierName}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">${r.current.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">${r.days1to30.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">${r.days31to60.toFixed(2)}</td>
                  <td className={`px-4 py-2.5 text-right ${r.days61to90 > 0 ? "text-warning-600" : "text-text-secondary"}`}>
                    ${r.days61to90.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2.5 text-right ${r.over90 > 0 ? "font-medium text-danger-600" : "text-text-secondary"}`}>
                    ${r.over90.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-text-primary">${r.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
