import Link from "next/link";
import { LayoutGrid, Rocket, ArrowRight } from "lucide-react";
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

  // Brand-new workspace: nothing enabled yet. Instead of a bare two-card grid
  // (the "empty dashboard" bug new signups hit), show a proper setup view.
  if (billing.enabledModules.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />

        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-50">
            <Rocket className="size-7 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Finish setting up {orgName}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
              Your workspace is created — now pick the modules you need. Once activated, your
              dashboards, lists, and day-to-day tools appear here and in the sidebar.
            </p>
          </div>

          <ol className="mt-2 flex w-full max-w-lg flex-col gap-2 text-left">
            {[
              { step: 1, label: "Company created", done: true },
              { step: 2, label: "Choose your modules", done: false },
              { step: 3, label: "Activate billing — pay the one-time setup fee + first month", done: false },
            ].map((s) => (
              <li
                key={s.step}
                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-2.5"
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                    s.done ? "bg-success-500 text-white" : "border border-border text-text-tertiary"
                  }`}
                >
                  {s.done ? "✓" : s.step}
                </span>
                <span className={`text-sm ${s.done ? "text-text-secondary line-through" : "font-medium text-text-primary"}`}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/onboarding">
              <Button>
                Resume setup <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/modules">
              <Button variant="secondary">
                <LayoutGrid className="size-4" /> Browse Module Store
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

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
