import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface PettyCashFloatRow {
  id: string;
  projectId: string;
  projectName: string;
  fundName: string;
  initialAmount: number;
  currentBalance: number;
  currency: string;
  custodianName: string | null;
  status: "active" | "inactive" | "closed";
}

export async function listPettyCashFloats(supabase: SupabaseClient, orgId: string): Promise<PettyCashFloatRow[]> {
  const { data, error } = await supabase
    .from("project_petty_cash")
    .select("id, project_id, fund_name, initial_amount, current_balance, currency, status, projects(name), profiles(full_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      project_id: string;
      fund_name: string;
      initial_amount: number;
      current_balance: number;
      currency: string;
      status: PettyCashFloatRow["status"];
      projects: { name: string } | null;
      profiles: { full_name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.projects?.name ?? "Unknown project",
    fundName: row.fund_name,
    initialAmount: row.initial_amount,
    currentBalance: row.current_balance,
    currency: row.currency,
    custodianName: row.profiles?.full_name ?? null,
    status: row.status,
  }));
}

export interface IssuePettyCashFloatInput {
  projectId: string;
  fundName: string;
  initialAmount: number;
  custodianId?: string;
}

export async function issuePettyCashFloat(supabase: SupabaseClient, input: IssuePettyCashFloatInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_petty_cash_fund", {
    p_project_id: input.projectId,
    p_fund_name: input.fundName,
    p_initial_amount: input.initialAmount,
    p_custodian_id: input.custodianId || null,
  });
  if (error) throw error;

  return data as unknown as string;
}

export async function closePettyCashFloat(supabase: SupabaseClient, floatId: string): Promise<void> {
  const { error } = await supabase.from("project_petty_cash").update({ status: "closed" }).eq("id", floatId);
  if (error) throw error;
}

export interface PettyCashTransactionRow {
  id: string;
  pettyCashId: string;
  fundName: string;
  transactionType: "replenish" | "disbursement" | "reimbursement" | "adjustment";
  amount: number;
  description: string;
  category: string | null;
  receiptNumber: string | null;
  recipientName: string | null;
  transactionDate: string;
}

export async function listPettyCashTransactions(supabase: SupabaseClient, orgId: string): Promise<PettyCashTransactionRow[]> {
  const { data, error } = await supabase
    .from("petty_cash_transactions")
    .select(
      "id, petty_cash_id, transaction_type, amount, description, category, receipt_number, transaction_date, project_petty_cash(fund_name), profiles!recipient_id(full_name)"
    )
    .eq("org_id", orgId)
    .order("transaction_date", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      petty_cash_id: string;
      transaction_type: PettyCashTransactionRow["transactionType"];
      amount: number;
      description: string;
      category: string | null;
      receipt_number: string | null;
      transaction_date: string;
      project_petty_cash: { fund_name: string } | null;
      profiles: { full_name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    pettyCashId: row.petty_cash_id,
    fundName: row.project_petty_cash?.fund_name ?? "Unknown fund",
    transactionType: row.transaction_type,
    amount: row.amount,
    description: row.description,
    category: row.category,
    receiptNumber: row.receipt_number,
    recipientName: row.profiles?.full_name ?? null,
    transactionDate: row.transaction_date,
  }));
}

export interface RecordPettyCashTransactionInput {
  pettyCashId: string;
  transactionType: string;
  amount: number;
  description: string;
  category?: string;
  receiptNumber?: string;
  recipientId?: string;
}

export async function recordPettyCashTransaction(supabase: SupabaseClient, input: RecordPettyCashTransactionInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_petty_cash_transaction", {
    p_petty_cash_id: input.pettyCashId,
    p_transaction_type: input.transactionType,
    p_amount: input.amount,
    p_description: input.description,
    p_category: input.category || null,
    p_receipt_number: input.receiptNumber || null,
    p_recipient_id: input.recipientId || null,
  });
  if (error) throw error;

  return data as unknown as string;
}
