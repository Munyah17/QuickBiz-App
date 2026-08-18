import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import { getPnLSummary } from "./finance";
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

  if (enabledModules.has("fleet")) {
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

  if (enabledModules.has("purchasing")) {
    const { data } = await supabase
      .from("purchase_orders")
      .select("status, total, created_at")
      .eq("org_id", orgId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    const rows = (data ?? []) as Array<{ status: string; total: number }>;
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
  }

  return cards;
}
