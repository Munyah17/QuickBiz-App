"use client";

import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { CategoryDonutChart } from "@/components/CategoryDonutChart";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { useDemo } from "@/lib/demo/DemoContext";

export default function DemoReportsPage() {
  const { sales, expenses, opportunities, tickets, vehicles, projects, assets } = useDemo();

  const expenseSegments = (() => {
    const byAccount = new Map<string, number>();
    for (const e of expenses) byAccount.set(e.accountName, (byAccount.get(e.accountName) ?? 0) + e.amount);
    return Array.from(byAccount.entries()).map(([label, value]) => ({ label, value }));
  })();

  const pipelineSegments = (() => {
    const byStage = new Map<string, number>();
    for (const o of opportunities) byStage.set(o.stage, (byStage.get(o.stage) ?? 0) + o.value);
    return Array.from(byStage.entries()).map(([label, value]) => ({ label, value }));
  })();

  const countBy = <T,>(rows: T[], keyFn: (row: T) => string) => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(keyFn(row), (counts.get(keyFn(row)) ?? 0) + 1);
    return Array.from(counts.entries()).map(([label, value]) => ({ label: label.replace(/_/g, " "), value }));
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" />
      <p className="text-sm text-text-tertiary">A sample of the cross-module reports every enabled module contributes to, built off this sandbox&apos;s own data.</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Expenses by category" />
          <div className="p-4">
            {expenseSegments.length > 0 ? (
              <CategoryDonutChart chart={{ title: "Expenses", segments: expenseSegments }} />
            ) : (
              <p className="py-6 text-center text-sm text-text-tertiary">No data yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Pipeline by stage" />
          <div className="p-4">
            {pipelineSegments.length > 0 ? (
              <CategoryDonutChart chart={{ title: "Pipeline", segments: pipelineSegments }} />
            ) : (
              <p className="py-6 text-center text-sm text-text-tertiary">No data yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Tickets by status" />
          <div className="p-4">
            {tickets.length > 0 ? <BreakdownBarChart segments={countBy(tickets, (t) => t.status)} /> : <p className="py-6 text-center text-sm text-text-tertiary">No data yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Vehicles by status" />
          <div className="p-4">
            {vehicles.length > 0 ? <BreakdownBarChart segments={countBy(vehicles, (v) => v.status)} /> : <p className="py-6 text-center text-sm text-text-tertiary">No data yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Projects by status" />
          <div className="p-4">
            {projects.length > 0 ? <BreakdownBarChart segments={countBy(projects, (p) => p.status)} /> : <p className="py-6 text-center text-sm text-text-tertiary">No data yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Assets by status" />
          <div className="p-4">
            {assets.length > 0 ? <BreakdownBarChart segments={countBy(assets, (a) => a.status)} /> : <p className="py-6 text-center text-sm text-text-tertiary">No data yet.</p>}
          </div>
        </Card>
      </div>

      <p className="text-sm text-text-tertiary">Total revenue recorded this session: ${totalRevenue.toLocaleString()}</p>
    </div>
  );
}
