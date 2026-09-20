import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import { getPnLSummary } from "./finance";
import { getARAging } from "./sales";
import type { RevenuePoint, DonutSegment } from "./dashboard";

export interface ReportStat {
  label: string;
  value: string;
}

export type ReportCard =
  | { key: string; module: string; title: string; type: "trend"; points: RevenuePoint[]; stats: ReportStat[] }
  | { key: string; module: string; title: string; type: "donut"; segments: DonutSegment[]; stats: ReportStat[] }
  | {
      key: string;
      module: string;
      title: string;
      type: "bars";
      segments: DonutSegment[];
      currency?: boolean;
      stats: ReportStat[];
    };

function currency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function countBy<T>(rows: T[], keyFn: (row: T) => string): DonutSegment[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, value]) => ({ label: label.replace(/_/g, " "), value }));
}

// Buckets rows by UTC day across [fromIso, toIso] — same Date.UTC discipline
// as the dashboard (server runs in Africa/Harare, UTC+2; local-midnight math
// would silently drop the range's boundary days).
function bucketByDay(rows: Array<{ created_at: string; amount: number }>, fromIso: string, toIso: string): RevenuePoint[] {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const byDate = new Map<string, number>();
  for (
    let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    d <= to;
    d = new Date(d.getTime() + 86400000)
  ) {
    byDate.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (byDate.has(key)) byDate.set(key, (byDate.get(key) ?? 0) + row.amount);
  }
  return Array.from(byDate.entries()).map(([date, revenue]) => ({ date, revenue }));
}

export async function getReportingData(
  supabase: SupabaseClient,
  orgId: string,
  enabledModules: Set<string>,
  fromIso: string,
  toIso: string
): Promise<ReportCard[]> {
  const cards: ReportCard[] = [];

  if (enabledModules.has("sales") || enabledModules.has("pos")) {
    const { data } = await supabase
      .from("sales_invoices")
      .select("total, status, created_at")
      .eq("org_id", orgId)
      .eq("doc_type", "invoice")
      .neq("status", "cancelled")
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    const rows = (data ?? []) as Array<{ total: number; status: string; created_at: string }>;
    const totalRevenue = rows.reduce((sum, r) => sum + r.total, 0);
    const points = bucketByDay(
      rows.map((r) => ({ created_at: r.created_at, amount: r.total })),
      fromIso,
      toIso
    );

    cards.push({
      key: "sales_trend",
      module: "Sales",
      title: "Revenue trend",
      type: "trend",
      points,
      stats: [
        { label: "Total revenue", value: currency(totalRevenue) },
        { label: "Invoices", value: String(rows.length) },
        { label: "Average invoice", value: currency(rows.length > 0 ? totalRevenue / rows.length : 0) },
      ],
    });

    // Top products by revenue in range
    const { data: topItems } = await supabase
      .from("sales_invoice_items")
      .select("description, line_total, sales_invoices!inner(org_id, status, created_at)")
      .eq("sales_invoices.org_id", orgId)
      .eq("sales_invoices.doc_type", "invoice")
      .neq("sales_invoices.status", "cancelled")
      .gte("sales_invoices.created_at", fromIso)
      .lte("sales_invoices.created_at", toIso);
    const itemRows = (topItems ?? []) as unknown as Array<{ description: string; line_total: number }>;
    const byProduct = new Map<string, number>();
    for (const it of itemRows) byProduct.set(it.description, (byProduct.get(it.description) ?? 0) + it.line_total);
    const topProducts = Array.from(byProduct.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    if (topProducts.length > 0) {
      cards.push({
        key: "sales_top_products",
        module: "Sales",
        title: "Top products by revenue",
        type: "bars",
        currency: true,
        segments: topProducts,
        stats: [
          { label: "Lines sold", value: String(itemRows.length) },
          { label: "Best seller", value: topProducts[0]?.label ?? "—" },
        ],
      });
    }

    // Margin by product: revenue minus (qty sold × current cost). Uses
    // today's cost price — close enough for a management view, since
    // historical cost isn't tracked per line.
    const { data: marginDesc } = await supabase
      .from("sales_invoice_items")
      .select("description, quantity, line_total, products(cost_price), sales_invoices!inner(org_id, status, created_at)")
      .eq("sales_invoices.org_id", orgId)
      .eq("sales_invoices.doc_type", "invoice")
      .neq("sales_invoices.status", "cancelled")
      .gte("sales_invoices.created_at", fromIso)
      .lte("sales_invoices.created_at", toIso);
    const marginDescRows = (marginDesc ?? []) as unknown as Array<{
      description: string;
      quantity: number;
      line_total: number;
      products: { cost_price: number } | null;
    }>;
    const marginMap = new Map<string, { margin: number; revenue: number }>();
    for (const it of marginDescRows) {
      const entry = marginMap.get(it.description) ?? { margin: 0, revenue: 0 };
      entry.margin += it.line_total - (it.products?.cost_price ?? 0) * it.quantity;
      entry.revenue += it.line_total;
      marginMap.set(it.description, entry);
    }
    const topMargin = Array.from(marginMap.entries())
      .map(([label, v]) => ({ label, value: Math.round(v.margin * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const totalMargin = Array.from(marginMap.values()).reduce((s, v) => s + v.margin, 0);
    const totalRevForMargin = Array.from(marginMap.values()).reduce((s, v) => s + v.revenue, 0);
    if (topMargin.length > 0) {
      cards.push({
        key: "sales_margin_products",
        module: "Sales",
        title: "Gross margin by product",
        type: "bars",
        currency: true,
        segments: topMargin,
        stats: [
          { label: "Est. gross margin", value: currency(totalMargin) },
          {
            label: "Margin %",
            value: totalRevForMargin > 0 ? `${((totalMargin / totalRevForMargin) * 100).toFixed(1)}%` : "—",
          },
        ],
      });
    }

    // Top customers by billed revenue in range
    const { data: byCust } = await supabase
      .from("sales_invoices")
      .select("total, customers(name)")
      .eq("org_id", orgId)
      .eq("doc_type", "invoice")
      .neq("status", "cancelled")
      .not("customer_id", "is", null)
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    const custRows = (byCust ?? []) as unknown as Array<{ total: number; customers: { name: string } | null }>;
    const byCustomer = new Map<string, number>();
    for (const r of custRows) {
      const name = r.customers?.name ?? "Unknown";
      byCustomer.set(name, (byCustomer.get(name) ?? 0) + r.total);
    }
    const topCustomers = Array.from(byCustomer.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    if (topCustomers.length > 0) {
      cards.push({
        key: "sales_top_customers",
        module: "Sales",
        title: "Top customers by revenue",
        type: "bars",
        currency: true,
        segments: topCustomers,
        stats: [{ label: "Customers billed", value: String(byCustomer.size) }],
      });
    }

    // Sales by branch — shows which location drives revenue.
    const { data: byBranch } = await supabase
      .from("sales_invoices")
      .select("total, branches(name)")
      .eq("org_id", orgId)
      .eq("doc_type", "invoice")
      .neq("status", "cancelled")
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    const branchRows = (byBranch ?? []) as unknown as Array<{ total: number; branches: { name: string } | null }>;
    const byBranchMap = new Map<string, number>();
    for (const r of branchRows) {
      const name = r.branches?.name ?? "Unknown branch";
      byBranchMap.set(name, (byBranchMap.get(name) ?? 0) + r.total);
    }
    if (byBranchMap.size > 0) {
      cards.push({
        key: "sales_by_branch",
        module: "Sales",
        title: "Revenue by branch",
        type: "bars",
        currency: true,
        segments: Array.from(byBranchMap.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        stats: [{ label: "Branches with sales", value: String(byBranchMap.size) }],
      });
    }

    // Collections by payment method — shows how money actually arrives
    // (cash vs mobile money vs bank), useful for till reconciliation.
    const { data: payRows } = await supabase
      .from("sales_payments")
      .select("amount, method, paid_at, sales_invoices!inner(org_id, doc_type)")
      .eq("sales_invoices.org_id", orgId)
      .eq("sales_invoices.doc_type", "invoice")
      .gte("paid_at", fromIso)
      .lte("paid_at", toIso);
    const payments = (payRows ?? []) as unknown as Array<{ amount: number; method: string }>;
    if (payments.length > 0) {
      const byMethod = new Map<string, number>();
      for (const p of payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount);
      cards.push({
        key: "sales_payment_methods",
        module: "Sales",
        title: "Collections by payment method",
        type: "bars",
        currency: true,
        segments: Array.from(byMethod.entries())
          .map(([label, value]) => ({ label: label.replace(/_/g, " "), value }))
          .sort((a, b) => b.value - a.value),
        stats: [
          { label: "Collected", value: currency(payments.reduce((s, p) => s + p.amount, 0)) },
          { label: "Payments", value: String(payments.length) },
        ],
      });
    }

    // AR aging is point-in-time (open balances today), not range-bound.
    const aging = await getARAging(supabase, orgId);
    if (aging.length > 0) {
      const bucket = (fn: (r: (typeof aging)[number]) => number) => aging.reduce((s, r) => s + fn(r), 0);
      const totalAr = aging.reduce((s, r) => s + r.total, 0);
      const overdueTotal = totalAr - bucket((r) => r.current);
      cards.push({
        key: "ar_aging",
        module: "Sales",
        title: "Accounts receivable aging",
        type: "bars",
        currency: true,
        segments: [
          { label: "Current", value: bucket((r) => r.current) },
          { label: "1–30 days", value: bucket((r) => r.days1to30) },
          { label: "31–60 days", value: bucket((r) => r.days31to60) },
          { label: "61–90 days", value: bucket((r) => r.days61to90) },
          { label: "90+ days", value: bucket((r) => r.over90) },
        ],
        stats: [
          { label: "Total outstanding", value: currency(totalAr) },
          { label: "Overdue", value: currency(overdueTotal) },
          { label: "Accounts owing", value: String(aging.length) },
        ],
      });
    }
  }

  if (enabledModules.has("finance")) {
    const pnl = await getPnLSummary(supabase, orgId, fromIso, toIso);
    cards.push({
      key: "finance_expenses",
      module: "Finance",
      title: "Expenses by category",
      type: "donut",
      segments: pnl.expensesByAccount.map((e) => ({ label: e.name, value: e.amount })),
      stats: [
        { label: "Revenue", value: currency(pnl.revenue) },
        { label: "Total expenses", value: currency(pnl.totalExpenses) },
        { label: "Net income", value: currency(pnl.netIncome) },
      ],
    });

    const { data: expRows } = await supabase
      .from("expenses")
      .select("amount, expense_date")
      .eq("org_id", orgId)
      .in("status", ["approved", "paid"])
      .gte("expense_date", fromIso.slice(0, 10))
      .lte("expense_date", toIso.slice(0, 10));
    const expensePoints = bucketByDay(
      ((expRows ?? []) as Array<{ amount: number; expense_date: string }>).map((e) => ({
        created_at: e.expense_date,
        amount: e.amount,
      })),
      fromIso,
      toIso
    );
    if (expensePoints.some((p) => p.revenue > 0)) {
      cards.push({
        key: "finance_expense_trend",
        module: "Finance",
        title: "Expense trend",
        type: "trend",
        points: expensePoints,
        stats: [
          { label: "Days with spend", value: String(expensePoints.filter((p) => p.revenue > 0).length) },
          { label: "Peak day", value: currency(Math.max(...expensePoints.map((p) => p.revenue))) },
        ],
      });
    }
  }

  if (enabledModules.has("inventory")) {
    const { data } = await supabase
      .from("stock_levels")
      .select("quantity_on_hand, products(cost_price, reorder_level, is_active, product_categories(name))")
      .eq("org_id", orgId);
    const rows = (data ?? []) as unknown as Array<{
      quantity_on_hand: number;
      products: { cost_price: number; reorder_level: number; is_active: boolean; product_categories: { name: string } | null } | null;
    }>;

    const byCategory = new Map<string, number>();
    let lowStock = 0;
    for (const r of rows) {
      if (!r.products?.is_active) continue;
      const value = r.quantity_on_hand * r.products.cost_price;
      const category = r.products.product_categories?.name ?? "Uncategorized";
      byCategory.set(category, (byCategory.get(category) ?? 0) + value);
      if (r.quantity_on_hand <= r.products.reorder_level) lowStock += 1;
    }
    const totalValue = Array.from(byCategory.values()).reduce((sum, v) => sum + v, 0);

    cards.push({
      key: "inventory_valuation",
      module: "Inventory",
      title: "Stock valuation by category",
      type: "bars",
      currency: true,
      segments: Array.from(byCategory.entries()).map(([label, value]) => ({ label, value })),
      stats: [
        { label: "Total valuation", value: currency(totalValue) },
        { label: "Low stock items", value: String(lowStock) },
      ],
    });
  }

  if (enabledModules.has("crm")) {
    const { data } = await supabase.from("opportunities").select("value, stage, created_at").eq("org_id", orgId);
    const rows = (data ?? []) as Array<{ value: number; stage: string; created_at: string }>;
    const openValue = rows.filter((o) => o.stage !== "won" && o.stage !== "lost").reduce((sum, o) => sum + o.value, 0);
    const wonInRange = rows.filter((o) => o.stage === "won" && o.created_at >= fromIso && o.created_at <= toIso).length;

    const byStage = new Map<string, number>();
    for (const o of rows) byStage.set(o.stage, (byStage.get(o.stage) ?? 0) + o.value);

    cards.push({
      key: "crm_pipeline",
      module: "CRM",
      title: "Pipeline by stage",
      type: "bars",
      currency: true,
      segments: Array.from(byStage.entries()).map(([label, value]) => ({ label: label.replace(/_/g, " "), value })),
      stats: [
        { label: "Open pipeline", value: currency(openValue) },
        { label: "Won this range", value: String(wonInRange) },
      ],
    });
  }

  if (enabledModules.has("hr")) {
    const { data } = await supabase
      .from("employees")
      .select("employment_status, departments(name)")
      .eq("org_id", orgId)
      .eq("employment_status", "active");
    const rows = (data ?? []) as unknown as Array<{ departments: { name: string } | null }>;

    cards.push({
      key: "hr_headcount",
      module: "HR",
      title: "Headcount by department",
      type: "bars",
      segments: countBy(rows, (r) => r.departments?.name ?? "Unassigned"),
      stats: [{ label: "Active employees", value: String(rows.length) }],
    });
  }

  if (enabledModules.has("logistics")) {
    const [{ data: vehicles }, { data: fuel }] = await Promise.all([
      supabase.from("vehicles").select("status").eq("org_id", orgId),
      supabase.from("fuel_logs").select("cost, fuel_date").eq("org_id", orgId).gte("fuel_date", fromIso.slice(0, 10)).lte("fuel_date", toIso.slice(0, 10)),
    ]);
    const vehicleRows = (vehicles ?? []) as Array<{ status: string }>;
    const fuelCost = ((fuel ?? []) as Array<{ cost: number }>).reduce((sum, f) => sum + f.cost, 0);

    cards.push({
      key: "fleet_status",
      module: "Fleet",
      title: "Vehicles by status",
      type: "bars",
      segments: countBy(vehicleRows, (v) => v.status),
      stats: [
        { label: "Total vehicles", value: String(vehicleRows.length) },
        { label: "Fuel spend this range", value: currency(fuelCost) },
      ],
    });
  }

  if (enabledModules.has("service_management")) {
    const { data } = await supabase
      .from("tickets")
      .select("status, created_at")
      .eq("org_id", orgId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    const rows = (data ?? []) as Array<{ status: string }>;

    cards.push({
      key: "service_tickets",
      module: "Service Management",
      title: "Tickets by status",
      type: "bars",
      segments: countBy(rows, (r) => r.status),
      stats: [{ label: "Tickets this range", value: String(rows.length) }],
    });
  }

  if (enabledModules.has("assets")) {
    const { data } = await supabase.from("assets").select("status, purchase_cost").eq("org_id", orgId);
    const rows = (data ?? []) as Array<{ status: string; purchase_cost: number }>;
    const totalCost = rows.reduce((sum, a) => sum + a.purchase_cost, 0);

    cards.push({
      key: "assets_status",
      module: "Assets",
      title: "Assets by status",
      type: "bars",
      segments: countBy(rows, (r) => r.status),
      stats: [
        { label: "Total assets", value: String(rows.length) },
        { label: "Total purchase cost", value: currency(totalCost) },
      ],
    });
  }

  if (enabledModules.has("projects")) {
    const { data } = await supabase.from("projects").select("status, budget").eq("org_id", orgId);
    const rows = (data ?? []) as Array<{ status: string; budget: number }>;

    cards.push({
      key: "projects_status",
      module: "Projects",
      title: "Projects by status",
      type: "bars",
      segments: countBy(rows, (r) => r.status),
      stats: [{ label: "Total projects", value: String(rows.length) }],
    });
  }

  if (enabledModules.has("sales")) {
    const { data } = await supabase
      .from("purchase_orders")
      .select("status, total, created_at, suppliers(name)")
      .eq("org_id", orgId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    const rows = (data ?? []) as Array<{ status: string; total: number; suppliers: { name: string } | null }>;
    const totalValue = rows.reduce((sum, po) => sum + po.total, 0);

    cards.push({
      key: "purchasing_status",
      module: "Purchasing",
      title: "Purchase orders by status",
      type: "bars",
      segments: countBy(rows, (r) => r.status),
      stats: [
        { label: "Purchase orders this range", value: String(rows.length) },
        { label: "Total value", value: currency(totalValue) },
      ],
    });

    const bySupplier = new Map<string, number>();
    for (const r of rows) {
      if (r.status === "cancelled") continue;
      const name = r.suppliers?.name ?? "No supplier";
      bySupplier.set(name, (bySupplier.get(name) ?? 0) + r.total);
    }
    if (bySupplier.size > 0) {
      cards.push({
        key: "purchasing_by_supplier",
        module: "Purchasing",
        title: "Spend by supplier",
        type: "bars",
        currency: true,
        segments: Array.from(bySupplier.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
        stats: [{ label: "Suppliers used", value: String(bySupplier.size) }],
      });
    }

    // AP position — point-in-time, not range-bound: open PO balances by
    // how late they are against their expected/promised date.
    const { data: apRows } = await supabase
      .from("purchase_orders")
      .select("total, amount_paid, expected_date, suppliers(name)")
      .eq("org_id", orgId)
      .in("status", ["issued", "received"]);
    const ap = (apRows ?? []) as unknown as Array<{
      total: number;
      amount_paid: number;
      expected_date: string | null;
      suppliers: { name: string } | null;
    }>;
    const openAp = ap.filter((r) => r.total - r.amount_paid > 0);
    if (openAp.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      let notDue = 0;
      let late = 0;
      let veryLate = 0;
      let noDate = 0;
      for (const r of openAp) {
        const bal = r.total - r.amount_paid;
        if (!r.expected_date) noDate += bal;
        else if (r.expected_date >= today) notDue += bal;
        else if (r.expected_date >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)) late += bal;
        else veryLate += bal;
      }
      const totalAp = openAp.reduce((s, r) => s + (r.total - r.amount_paid), 0);
      cards.push({
        key: "ap_aging",
        module: "Purchasing",
        title: "Accounts payable",
        type: "bars",
        currency: true,
        segments: [
          { label: "Not yet due", value: notDue },
          { label: "1–30 days late", value: late },
          { label: "30+ days late", value: veryLate },
          { label: "No expected date", value: noDate },
        ],
        stats: [
          { label: "Owed to suppliers", value: currency(totalAp) },
          { label: "Open POs", value: String(openAp.length) },
          { label: "Late", value: currency(late + veryLate) },
        ],
      });
    }
  }

  return cards;
}
