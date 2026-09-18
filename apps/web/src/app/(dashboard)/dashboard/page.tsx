import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, type StatCardTone } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";
import { CategoryDonutChart } from "@/components/CategoryDonutChart";
import { ActivityFeed } from "@/components/ActivityFeed";
import { requireOrgContext } from "@/lib/session";
import { getDashboardStats, getDashboardOverview, getAttentionItems } from "@/services/dashboard";
import { getBillingSummary } from "@/services/billing";
import { listAuditLogs } from "@/services/audit";

function delta(count: number): { label: string; direction: "up" | "flat" } {
  if (count === 0) return { label: "No change in last 30 days", direction: "flat" };
  return { label: `+${count} in last 30 days`, direction: "up" };
}

// Fixed, non-cycled order (dataviz skill) - decorative rotation for the
// headline cards, same four positions every time, not tied to any data
// dimension.
const HEADLINE_TONES: StatCardTone[] = ["primary", "success", "info", "warning"];

export default async function DashboardPage() {
  const { supabase, orgId, orgName, permissions } = await requireOrgContext();
  const [stats, overview, billing, activity, attention] = await Promise.all([
    getDashboardStats(supabase, orgId),
    getDashboardOverview(supabase, orgId),
    getBillingSummary(supabase, orgId),
    permissions.has("audit.view") ? listAuditLogs(supabase, orgId, 8) : Promise.resolve([]),
    getAttentionItems(supabase, orgId),
  ]);

  const hasRevenueData = overview.revenueTrend && overview.revenueTrend.some((p) => p.revenue > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" />

      {/* Module-aware dashboard (spec §58): core platform counters always
          show; every KPI beyond that only appears once its module is
          actually enabled, and is computed from real rows, never fabricated. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Team members"
          value={String(stats.memberCount)}
          delta={delta(stats.membersAddedLast30Days)}
          tone={HEADLINE_TONES[0]}
        />
        <StatCard
          label="Branches"
          value={String(stats.branchCount)}
          delta={delta(stats.branchesAddedLast30Days)}
          tone={HEADLINE_TONES[1]}
        />
        {overview.moduleKpis.map((kpi, i) => (
          <StatCard key={kpi.key} label={kpi.label} value={kpi.value} tone={HEADLINE_TONES[(i + 2) % HEADLINE_TONES.length]} />
        ))}
      </div>

      {(overview.revenueTrend || overview.donut) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {overview.revenueTrend && (
            <Card className="lg:col-span-2">
              <CardHeader title="Revenue, last 14 days" />
              <div className="p-4">
                {hasRevenueData ? (
                  <RevenueTrendChart data={overview.revenueTrend} />
                ) : (
                  <p className="py-8 text-center text-sm text-text-tertiary">No sales recorded in the last 14 days yet.</p>
                )}
              </div>
            </Card>
          )}
          {overview.donut && (
            <Card>
              <CardHeader title={overview.donut.title} />
              <div className="p-4">
                <CategoryDonutChart chart={overview.donut} />
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" />
          <ActivityFeed logs={activity} />
        </Card>

        <div className="flex flex-col gap-4">
          {attention.length > 0 && (
            <Card className="flex flex-col gap-1 p-4">
              <p className="mb-2 text-sm font-semibold text-text-primary">Needs attention</p>
              {attention.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center justify-between gap-2 rounded-md border border-border-subtle px-3 py-2 hover:border-primary-300 hover:bg-primary-50"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.detail}</p>
                  </div>
                  <Badge tone={item.severity}>{item.severity === "danger" ? "Urgent" : "Review"}</Badge>
                </Link>
              ))}
            </Card>
          )}

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50">
              <LayoutGrid className="size-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{orgName}</p>
              <p className="text-xs text-text-secondary">
                {billing.enabledModules.length} module{billing.enabledModules.length === 1 ? "" : "s"} enabled
                (${billing.monthlyTotalUsd.toFixed(2)}/mo)
              </p>
            </div>
          </div>
          <p className="text-sm text-text-secondary">Browse available modules, and their pricing, in the Module Store.</p>
          <Link href="/modules" className="mt-auto">
            <Button variant="secondary" className="w-full">
              Module Store
            </Button>
          </Link>
        </Card>
        </div>
      </div>
    </div>
  );
}
