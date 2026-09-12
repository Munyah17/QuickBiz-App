import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/StatCard";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";
import { Card, CardHeader } from "@/components/Card";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listInvoices } from "@/services/sales";
import { SalesTable } from "./SalesTable";

export default async function SalesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  const canManage = permissions.has("sales.manage");

  const invoices = await listInvoices(supabase, orgId);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;
  const issuedInvoices = invoices.filter((inv) => inv.status === "issued").length;
  const unpaidBalance = invoices.reduce((sum, inv) => sum + (inv.total - inv.amount_paid), 0);
  const totalInvoices = invoices.length;

  // Daily revenue trend over the last 14 days, matching the Dashboard's own
  // revenue chart shape/window (RevenuePoint = {date, revenue}) rather than
  // a different monthly-bucket shape the chart component doesn't accept.
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const dailyRevenue = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    dailyRevenue.set(d.toISOString().slice(0, 10), 0);
  }
  for (const inv of invoices) {
    const day = inv.created_at.slice(0, 10);
    if (dailyRevenue.has(day)) dailyRevenue.set(day, (dailyRevenue.get(day) ?? 0) + inv.total);
  }
  const chartData = Array.from(dailyRevenue, ([date, revenue]) => ({ date, revenue }));
  const hasRevenueData = chartData.some((p) => p.revenue > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Sales" />
        {canManage && (
          <Link href="/sales/new">
            <Button>
              <Plus className="size-4" />
              New Invoice
            </Button>
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          tone="primary"
        />
        <StatCard
          label="Total invoices"
          value={totalInvoices.toString()}
          tone="info"
        />
        <StatCard
          label="Paid"
          value={paidInvoices.toString()}
          tone="success"
        />
        <StatCard
          label="Issued, unpaid"
          value={issuedInvoices.toString()}
          delta={unpaidBalance > 0 ? { label: `$${unpaidBalance.toLocaleString()} outstanding`, direction: "down" } : undefined}
          tone={issuedInvoices > 0 ? "warning" : undefined}
        />
      </div>

      {hasRevenueData && (
        <Card>
          <CardHeader title="Revenue, last 14 days" />
          <div className="p-4">
            <RevenueTrendChart data={chartData} />
          </div>
        </Card>
      )}

      <SalesTable invoices={invoices} />
    </div>
  );
}
