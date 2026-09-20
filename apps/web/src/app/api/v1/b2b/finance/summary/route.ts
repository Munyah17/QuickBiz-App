import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";

// GET /api/v1/b2b/finance/summary — revenue, receivables, expense totals.
// Private keys only — financial data is B2B, not exposed to module keys.
export const GET = apiHandler(
  { endpoint: "GET /v1/b2b/finance/summary", scope: "private" },
  async (_request, ctx) => {
    const supabase = createServiceRoleClient();

    const [invoices, expenses] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("total, amount_paid, status")
        .eq("org_id", ctx.orgId)
        .eq("doc_type", "invoice")
        .neq("status", "cancelled"),
      supabase
        .from("expenses")
        .select("amount, status")
        .eq("org_id", ctx.orgId)
        .neq("status", "rejected"),
    ]);

    if (invoices.error) throw invoices.error;
    if (expenses.error) throw expenses.error;

    const rows = invoices.data ?? [];
    const expenseRows = expenses.data ?? [];

    return {
      revenue_total: rows.reduce((s, r) => s + r.total, 0),
      collected_total: rows.reduce((s, r) => s + r.amount_paid, 0),
      receivables_total: rows.reduce((s, r) => s + Math.max(0, r.total - r.amount_paid), 0),
      invoice_count: rows.length,
      expenses_total: expenseRows.reduce((s, r) => s + r.amount, 0),
      expense_count: expenseRows.length,
    };
  }
);
