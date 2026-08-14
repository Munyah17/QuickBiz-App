import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { requireOrgContext } from "@/lib/session";
import { getDashboardStats } from "@/services/dashboard";
import { getBillingSummary } from "@/services/billing";
import { listEnabledModuleKeys } from "@/services/modules";
import { getSalesStats } from "@/services/sales";
import { getInventoryStats } from "@/services/products";

function delta(count: number): { label: string; direction: "up" | "flat" } {
  if (count === 0) return { label: "No change in last 30 days", direction: "flat" };
  return { label: `+${count} in last 30 days`, direction: "up" };
}

export default async function DashboardPage() {
  const { supabase, orgId, orgName } = await requireOrgContext();
  const [stats, billing, enabledModules] = await Promise.all([
    getDashboardStats(supabase, orgId),
    getBillingSummary(supabase, orgId),
    listEnabledModuleKeys(supabase, orgId),
  ]);

  const salesEnabled = enabledModules.includes("sales");
  const inventoryEnabled = enabledModules.includes("inventory");

  const [salesStats, inventoryStats] = await Promise.all([
    salesEnabled ? getSalesStats(supabase, orgId) : null,
    inventoryEnabled ? getInventoryStats(supabase, orgId) : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" />

      {/* Module-aware dashboard (spec §58): widgets only appear for modules
          the org has actually enabled, instead of a fixed fabricated set. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Team members" value={String(stats.memberCount)} delta={delta(stats.membersAddedLast30Days)} />
        <StatCard label="Branches" value={String(stats.branchCount)} delta={delta(stats.branchesAddedLast30Days)} />
        <StatCard label="Active modules" value={String(stats.enabledModuleCount)} />
        {salesStats && (
          <>
            <StatCard label="Total sales" value={`$${salesStats.totalSales.toFixed(2)}`} />
            <StatCard label="Outstanding" value={`$${salesStats.outstanding.toFixed(2)}`} />
            <StatCard label="Invoices" value={String(salesStats.invoiceCount)} />
          </>
        )}
        {inventoryStats && (
          <>
            <StatCard label="Products" value={String(inventoryStats.productCount)} />
            <StatCard
              label="Low stock"
              value={String(inventoryStats.lowStockCount)}
              delta={
                inventoryStats.lowStockCount > 0
                  ? { label: "Needs restocking", direction: "up" }
                  : { label: "All stocked", direction: "flat" }
              }
            />
          </>
        )}
      </div>

      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary-50">
            <LayoutGrid className="size-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {orgName}: {billing.enabledModules.length} module{billing.enabledModules.length === 1 ? "" : "s"} enabled
              (${billing.monthlyTotalUsd.toFixed(2)}/mo)
            </p>
            <p className="text-sm text-text-secondary">
              Browse available modules, and their pricing, in the Module Store.
            </p>
          </div>
        </div>
        <Link href="/modules">
          <Button variant="secondary">Module Store</Button>
        </Link>
      </Card>
    </div>
  );
}
