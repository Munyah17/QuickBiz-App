import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import { getPnLSummary } from "./finance";

export interface DashboardStats {
  memberCount: number;
  membersAddedLast30Days: number;
  branchCount: number;
  branchesAddedLast30Days: number;
  enabledModuleCount: number;
}

export async function getDashboardStats(supabase: SupabaseClient, orgId: string): Promise<DashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [members, recentMembers, branches, recentBranches, enabledModules] = await Promise.all([
    supabase.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "active"),
    supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active")
      .gte("created_at", sinceIso),
    supabase.from("branches").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("is_active", true),
    supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true)
      .gte("created_at", sinceIso),
    supabase
      .from("org_modules")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "enabled"),
  ]);

  return {
    memberCount: members.count ?? 0,
    membersAddedLast30Days: recentMembers.count ?? 0,
    branchCount: branches.count ?? 0,
    branchesAddedLast30Days: recentBranches.count ?? 0,
    enabledModuleCount: enabledModules.count ?? 0,
  };
}

export interface ModuleKpi {
  key: string;
  label: string;
  value: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface DonutSegment {
  label: string;
  value: number;
}

export interface DonutChart {
  title: string;
  segments: DonutSegment[];
}

export interface DashboardOverview {
  enabledModules: Set<string>;
  moduleKpis: ModuleKpi[];
  revenueTrend: RevenuePoint[] | null;
  donut: DonutChart | null;
}

function currency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function getDashboardOverview(supabase: SupabaseClient, orgId: string): Promise<DashboardOverview> {
  const { data: orgModules } = await supabase.from("org_modules").select("module_key").eq("org_id", orgId).eq("status", "enabled");
  const enabledModules = new Set((orgModules ?? []).map((m: { module_key: string }) => m.module_key));

  const moduleKpis: ModuleKpi[] = [];
  let revenueTrend: RevenuePoint[] | null = null;
  let donut: DonutChart | null = null;

  // Built with Date.UTC rather than local getFullYear/setDate/setHours: this
  // server runs in Africa/Harare (UTC+2), and local-midnight math shifts the
  // UTC day/month boundary by the offset — e.g. local Aug 1 00:00 CAT is
  // still Jul 31 22:00 UTC, silently pushing "today"'s rows into yesterday's
  // bucket. Postgres timestamps compare/slice in UTC, so bucketing must too.
  const nowDate = new Date();
  const monthStart = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 1)).toISOString();
  const now = nowDate.toISOString();

  if (enabledModules.has("sales") || enabledModules.has("pos")) {
    const since14 = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() - 13));

    const { data: invoices } = await supabase
      .from("sales_invoices")
      .select("total, amount_paid, status, created_at")
      .eq("org_id", orgId)
      .neq("status", "cancelled")
      .gte("created_at", since14.toISOString());

    const rows = (invoices ?? []) as Array<{ total: number; amount_paid: number; status: string; created_at: string }>;

    const revenueThisMonth = rows
      .filter((r) => r.created_at >= monthStart)
      .reduce((sum, r) => sum + r.total, 0);
    const outstanding = rows.filter((r) => r.status === "issued").reduce((sum, r) => sum + (r.total - r.amount_paid), 0);

    moduleKpis.push({ key: "revenue", label: "Revenue this month", value: currency(revenueThisMonth) });
    moduleKpis.push({ key: "outstanding", label: "Outstanding", value: currency(outstanding) });

    const byDate = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() - 13 + i));
      byDate.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of rows) {
      const key = row.created_at.slice(0, 10);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) ?? 0) + row.total);
    }
    revenueTrend = Array.from(byDate.entries()).map(([date, revenue]) => ({ date, revenue }));
  }

  if (enabledModules.has("inventory")) {
    const { data: stock } = await supabase.from("stock_levels").select("quantity_on_hand, products(reorder_level, is_active)").eq("org_id", orgId);
    const lowStock = (stock as unknown as Array<{ quantity_on_hand: number; products: { reorder_level: number; is_active: boolean } | null }> ?? []).filter(
      (s) => s.products?.is_active && s.quantity_on_hand <= (s.products?.reorder_level ?? 0)
    ).length;
    moduleKpis.push({ key: "low_stock", label: "Low stock items", value: String(lowStock) });
  }

  if (enabledModules.has("finance")) {
    const pnl = await getPnLSummary(supabase, orgId, monthStart, now);
    moduleKpis.push({ key: "net_income", label: "Net income this month", value: currency(pnl.netIncome) });

    if (!donut && pnl.expensesByAccount.length > 0) {
      donut = { title: "Expenses by category", segments: pnl.expensesByAccount.map((e) => ({ label: e.name, value: e.amount })) };
    }
  }

  if (enabledModules.has("crm")) {
    const { data: opportunities } = await supabase.from("opportunities").select("value, stage").eq("org_id", orgId);
    const rows = (opportunities ?? []) as Array<{ value: number; stage: string }>;
    const openValue = rows.filter((o) => o.stage !== "won" && o.stage !== "lost").reduce((sum, o) => sum + o.value, 0);
    moduleKpis.push({ key: "pipeline", label: "Open pipeline", value: currency(openValue) });

    if (!donut && rows.length > 0) {
      const byStage = new Map<string, number>();
      for (const o of rows) byStage.set(o.stage, (byStage.get(o.stage) ?? 0) + o.value);
      donut = {
        title: "Pipeline by stage",
        segments: Array.from(byStage.entries()).map(([label, value]) => ({ label: label.replace("_", " "), value })),
      };
    }
  }

  if (enabledModules.has("hr")) {
    const { count } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("employment_status", "active");
    moduleKpis.push({ key: "employees", label: "Active employees", value: String(count ?? 0) });
  }

  if (enabledModules.has("projects")) {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active");
    moduleKpis.push({ key: "active_projects", label: "Active projects", value: String(count ?? 0) });
  }

  if (enabledModules.has("purchasing")) {
    const { count } = await supabase
      .from("purchase_orders")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "issued");
    moduleKpis.push({ key: "open_pos", label: "Open purchase orders", value: String(count ?? 0) });
  }

  return { enabledModules, moduleKpis, revenueTrend, donut };
}
