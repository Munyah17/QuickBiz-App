"use client";

import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { useDemo } from "@/lib/demo/DemoContext";

function Row({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-border-subtle font-semibold" : ""}`}>
      <span className={`text-sm ${indent ? "pl-4 text-text-secondary" : "text-text-primary"}`}>{label}</span>
      <span className={`text-sm ${value < 0 ? "text-danger-600" : "text-text-primary"}`}>
        {value < 0 ? "-" : ""}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

export default function DemoFinancePage() {
  const { sales, products, expenses } = useDemo();

  const revenue = sales.reduce((sum, s) => sum + s.total, 0);
  const cogs = sales.reduce(
    (sum, s) => sum + s.lines.reduce((lineSum, l) => lineSum + l.quantity * (products.find((p) => p.id === l.productId)?.costPrice ?? 0), 0),
    0
  );
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = grossProfit - totalExpenses;

  const byAccount = new Map<string, number>();
  for (const e of expenses) byAccount.set(e.accountName, (byAccount.get(e.accountName) ?? 0) + e.amount);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Finance" title="Profit & Loss" />

      <Card className="max-w-xl">
        <CardHeader title="All time" />
        <div className="flex flex-col divide-y divide-border-subtle px-4 pb-4">
          <Row label="Revenue" value={revenue} />
          <Row label="Cost of Goods Sold" value={-cogs} indent />
          <Row label="Gross Profit" value={grossProfit} bold />
          {Array.from(byAccount.entries()).map(([name, amount]) => (
            <Row key={name} label={name} value={-amount} indent />
          ))}
          <Row label="Total Operating Expenses" value={-totalExpenses} />
          <Row label="Net Income" value={netIncome} bold />
        </div>
      </Card>
    </div>
  );
}
