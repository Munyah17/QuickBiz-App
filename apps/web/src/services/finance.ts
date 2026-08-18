import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  is_active: boolean;
}

export async function listAccounts(supabase: SupabaseClient, orgId: string): Promise<Account[]> {
  const { data, error } = await supabase.from("accounts").select("id, code, name, type, is_active").eq("org_id", orgId).order("code");
  if (error) throw error;
  return data as Account[];
}

export async function seedDefaultAccounts(supabase: SupabaseClient, orgId: string) {
  const { error } = await supabase.rpc("seed_default_accounts", { p_org_id: orgId });
  if (error) throw error;
}

export async function createAccount(supabase: SupabaseClient, orgId: string, input: { code: string; name: string; type: Account["type"] }) {
  const { error } = await supabase.from("accounts").insert({ org_id: orgId, ...input });
  if (error) throw error;
}

export async function setAccountActive(supabase: SupabaseClient, accountId: string, isActive: boolean) {
  const { error } = await supabase.from("accounts").update({ is_active: isActive }).eq("id", accountId);
  if (error) throw error;
}

export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  reference: string | null;
  accountName: string | null;
}

export async function listExpenses(supabase: SupabaseClient, orgId: string, limit = 100): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, description, amount, expense_date, payment_method, reference, accounts(name)")
    .eq("org_id", orgId)
    .order("expense_date", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data as unknown as Array<ExpenseRow & { accounts: { name: string } | null }>).map((row) => ({
    ...row,
    accountName: row.accounts?.name ?? null,
  }));
}

export async function createExpense(
  supabase: SupabaseClient,
  orgId: string,
  input: { branchId: string; accountId: string; description: string; amount: number; expenseDate: string; paymentMethod: string; reference: string }
) {
  const { error } = await supabase.from("expenses").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    account_id: input.accountId || null,
    description: input.description,
    amount: input.amount,
    expense_date: input.expenseDate,
    payment_method: input.paymentMethod,
    reference: input.reference || null,
  });
  if (error) throw error;
}

export interface PnLSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netIncome: number;
  expensesByAccount: Array<{ name: string; amount: number }>;
}

export async function getPnLSummary(supabase: SupabaseClient, orgId: string, from: string, to: string): Promise<PnLSummary> {
  const { data: invoices, error: invError } = await supabase
    .from("sales_invoices")
    .select("id, total, status")
    .eq("org_id", orgId)
    .neq("status", "cancelled")
    .gte("created_at", from)
    .lte("created_at", to);
  if (invError) throw invError;

  const revenue = (invoices ?? []).reduce((sum: number, inv: { total: number }) => sum + inv.total, 0);
  const invoiceIds = (invoices ?? []).map((inv: { id: string }) => inv.id);

  let cogs = 0;
  if (invoiceIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("sales_invoice_items")
      .select("quantity, product_id, products(cost_price)")
      .in("invoice_id", invoiceIds);
    if (itemsError) throw itemsError;
    for (const item of (items ?? []) as unknown as Array<{ quantity: number; products: { cost_price: number } | null }>) {
      cogs += item.quantity * (item.products?.cost_price ?? 0);
    }
  }

  const { data: expenses, error: expError } = await supabase
    .from("expenses")
    .select("amount, accounts(name)")
    .eq("org_id", orgId)
    .gte("expense_date", from.slice(0, 10))
    .lte("expense_date", to.slice(0, 10));
  if (expError) throw expError;

  const expenseRows = (expenses ?? []) as unknown as Array<{ amount: number; accounts: { name: string } | null }>;
  const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

  const byAccount = new Map<string, number>();
  for (const e of expenseRows) {
    const name = e.accounts?.name ?? "Uncategorized";
    byAccount.set(name, (byAccount.get(name) ?? 0) + e.amount);
  }

  const grossProfit = revenue - cogs;

  return {
    revenue,
    cogs,
    grossProfit,
    totalExpenses,
    netIncome: grossProfit - totalExpenses,
    expensesByAccount: Array.from(byAccount.entries()).map(([name, amount]) => ({ name, amount })),
  };
}
