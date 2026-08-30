"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { StatCard, type StatCardTone } from "@/components/StatCard";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";
import { CategoryDonutChart } from "@/components/CategoryDonutChart";
import { useDemo } from "@/lib/demo/DemoContext";
import type { RevenuePoint } from "@/services/dashboard";

const HEADLINE_TONES: StatCardTone[] = ["primary", "success", "info", "warning"];

export default function DemoDashboardPage() {
  const { sales, customers, products, branches } = useDemo();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  // Date.now() is impure, so it's captured once via a useState lazy
  // initializer (React's sanctioned escape hatch) rather than called
  // directly in the render body or inside useMemo.
  const [now] = useState(() => Date.now());

  const revenueTrend = useMemo<RevenuePoint[]>(() => {
    const byDate = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now - (13 - i) * 86400000);
      byDate.set(d.toISOString().slice(0, 10), 0);
    }
    for (const sale of sales) {
      const key = sale.createdAt.slice(0, 10);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) ?? 0) + sale.total);
    }
    return Array.from(byDate.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [sales, now]);

  const donutSegments = useMemo(() => {
    const byProduct = new Map<string, number>();
    for (const sale of sales) {
      for (const line of sale.lines) {
        byProduct.set(line.productName, (byProduct.get(line.productName) ?? 0) + line.quantity * line.unitPrice);
      }
    }
    return Array.from(byProduct.entries()).map(([label, value]) => ({ label, value }));
  }, [sales]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (all time)" value={`$${totalRevenue.toLocaleString()}`} tone={HEADLINE_TONES[0]} />
        <StatCard label="Products" value={String(products.length)} tone={HEADLINE_TONES[1]} />
        <StatCard label="Customers" value={String(customers.length)} tone={HEADLINE_TONES[2]} />
        <StatCard label="Branches" value={String(branches.length)} tone={HEADLINE_TONES[3]} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue trend, last 14 days" />
          <div className="p-4">
            <RevenueTrendChart data={revenueTrend} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Revenue by product" />
          <div className="p-4">
            {donutSegments.length > 0 ? (
              <CategoryDonutChart chart={{ title: "Revenue by product", segments: donutSegments }} />
            ) : (
              <p className="py-6 text-center text-sm text-text-tertiary">No sales recorded yet.</p>
            )}
          </div>
        </Card>
      </div>

      <p className="text-sm text-text-tertiary">
        This is a live sandbox: create a sale on the Sales page and watch these numbers update. Nothing here is
        saved, and refreshing the page resets everything back to this seed data.
      </p>
    </div>
  );
}
