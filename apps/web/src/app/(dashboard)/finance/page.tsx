import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getPnLSummary } from "@/services/finance";

// Date.UTC rather than local getFullYear/getMonth: this server runs in
// Africa/Harare (UTC+2), and local-midnight math shifts the UTC date by the
// offset (local Aug 1 00:00 CAT is still Jul 31 22:00 UTC), which would
// silently start the default P&L range a day early.
function firstOfMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  const params = await searchParams;
  const from = params.from || firstOfMonth();
  const to = params.to || today();

  const pnl = await getPnLSummary(supabase, orgId, `${from}T00:00:00Z`, `${to}T23:59:59Z`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Finance" title="Profit & Loss" />

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

      <Card className="max-w-xl">
        <CardHeader title={`${from} to ${to}`} />
        <div className="flex flex-col divide-y divide-border-subtle px-4 pb-4">
          <Row label="Revenue" value={pnl.revenue} />
          <Row label="Cost of Goods Sold" value={-pnl.cogs} indent />
          <Row label="Gross Profit" value={pnl.grossProfit} bold />

          {pnl.expensesByAccount.map((e) => (
            <Row key={e.name} label={e.name} value={-e.amount} indent />
          ))}
          <Row label="Total Operating Expenses" value={-pnl.totalExpenses} />

          <Row label="Net Income" value={pnl.netIncome} bold />
        </div>
      </Card>

      <p className="text-sm text-text-tertiary">
        Revenue comes from issued Sales invoices, cost of goods sold from each sold product&apos;s recorded cost
        price, and operating expenses from the Expenses log. This is a simple P&amp;L, not a full general ledger.
      </p>
    </div>
  );
}
