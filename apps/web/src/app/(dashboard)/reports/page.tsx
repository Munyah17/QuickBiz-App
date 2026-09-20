import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";
import { CategoryDonutChart } from "@/components/CategoryDonutChart";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listEnabledModuleKeys } from "@/services/modules";
import { getReportingData, type ReportStat } from "@/services/reporting";

// Date.UTC rather than local getters: this server runs in Africa/Harare
// (UTC+2), and local-midnight math shifts the UTC day boundary by the
// offset, silently dropping "today"'s rows from the default range.
function daysAgo(n: number): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - n)).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function StatRow({ stats }: { stats: ReportStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 border-t border-border-subtle px-4 pt-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="text-xs text-text-tertiary">{s.label}</p>
          <p className="text-sm font-semibold text-text-primary">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "documents");

  const params = await searchParams;
  const from = params.from || daysAgo(29);
  const to = params.to || today();

  const enabledKeys = await listEnabledModuleKeys(supabase, orgId);
  const enabledModules = new Set(enabledKeys);

  const cards = await getReportingData(supabase, orgId, enabledModules, `${from}T00:00:00Z`, `${to}T23:59:59Z`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Reporting" title="Cross-module reports" />

      <form className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">From</span>
          <input type="date" name="from" defaultValue={from} className="h-9 rounded-md border border-border px-3 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">To</span>
          <input type="date" name="to" defaultValue={to} className="h-9 rounded-md border border-border px-3 text-sm" />
        </label>
        <button type="submit" className="h-9 rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700">
          Apply
        </button>
      </form>

      {cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No reports available yet"
            description="Reports are generated from your enabled modules. Enable a business module from the Module Store to see reports here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.key}>
              <CardHeader title={card.title} action={<span className="text-xs text-text-tertiary">{card.module}</span>} />
              <div className="p-4">
                {card.type === "trend" && <RevenueTrendChart data={card.points} />}
                {card.type === "donut" &&
                  (card.segments.length > 0 ? (
                    <CategoryDonutChart chart={{ title: card.title, segments: card.segments }} />
                  ) : (
                    <p className="py-6 text-center text-sm text-text-tertiary">No data in this range.</p>
                  ))}
                {card.type === "bars" &&
                  (card.segments.length > 0 ? (
                    <BreakdownBarChart
                      segments={card.segments}
                      formatValue={card.currency ? (v) => `$${v.toLocaleString()}` : undefined}
                    />
                  ) : (
                    <p className="py-6 text-center text-sm text-text-tertiary">No data in this range.</p>
                  ))}
              </div>
              <StatRow stats={card.stats} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
