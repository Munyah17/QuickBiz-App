import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Json } from "@quickbiz/supabase/database.types";
import type { InvoiceLineInput } from "./sales";

export interface PosRegister {
  id: string;
  name: string;
}

export async function getRegisterForBranch(
  supabase: SupabaseClient,
  orgId: string,
  branchId: string
): Promise<PosRegister | null> {
  const { data, error } = await supabase
    .from("pos_registers")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("branch_id", branchId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface OpenSession {
  id: string;
  opening_float: number;
  opened_at: string;
  openedByName: string | null;
}

export async function getOpenSession(supabase: SupabaseClient, orgId: string, registerId: string): Promise<OpenSession | null> {
  const { data, error } = await supabase
    .from("pos_sessions")
    .select("id, opening_float, opened_at, profiles(full_name)")
    .eq("org_id", orgId)
    .eq("register_id", registerId)
    .eq("status", "open")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as { id: string; opening_float: number; opened_at: string; profiles: { full_name: string | null } | null };
  return { id: row.id, opening_float: row.opening_float, opened_at: row.opened_at, openedByName: row.profiles?.full_name ?? null };
}

export async function openSession(supabase: SupabaseClient, orgId: string, registerId: string, openingFloat: number): Promise<string> {
  const { data, error } = await supabase.rpc("open_pos_session", {
    p_org_id: orgId,
    p_register_id: registerId,
    p_opening_float: openingFloat,
  });
  if (error) throw error;
  return data as string;
}

export interface SessionSummary {
  invoiceCount: number;
  totalSales: number;
  cashSales: number;
  otherSales: number;
}

export async function getSessionSummary(supabase: SupabaseClient, orgId: string, sessionId: string): Promise<SessionSummary> {
  const { data: invoices, error } = await supabase
    .from("sales_invoices")
    .select("id, total")
    .eq("org_id", orgId)
    .eq("pos_session_id", sessionId);
  if (error) throw error;

  const invoiceIds = (invoices ?? []).map((i: { id: string }) => i.id);
  let cashSales = 0;
  let otherSales = 0;

  if (invoiceIds.length > 0) {
    const { data: payments, error: payError } = await supabase
      .from("sales_payments")
      .select("amount, method")
      .in("invoice_id", invoiceIds);
    if (payError) throw payError;
    for (const p of (payments ?? []) as Array<{ amount: number; method: string }>) {
      if (p.method === "cash") cashSales += p.amount;
      else otherSales += p.amount;
    }
  }

  return {
    invoiceCount: invoiceIds.length,
    totalSales: (invoices ?? []).reduce((sum: number, i: { total: number }) => sum + i.total, 0),
    cashSales,
    otherSales,
  };
}

export async function closeSession(supabase: SupabaseClient, orgId: string, sessionId: string, closingFloat: number) {
  const { error } = await supabase.rpc("close_pos_session", {
    p_org_id: orgId,
    p_session_id: sessionId,
    p_closing_float: closingFloat,
  });
  if (error) throw error;
}

export async function checkout(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    branchId: string;
    warehouseId: string;
    sessionId: string;
    customerId: string | null;
    items: InvoiceLineInput[];
    taxTotal: number;
    paymentMethod: string;
  }
): Promise<string> {
  const { data: invoiceId, error: invoiceErr } = await supabase.rpc("create_sales_invoice", {
    p_org_id: input.orgId,
    p_branch_id: input.branchId,
    p_customer_id: input.customerId ?? undefined,
    p_warehouse_id: input.warehouseId,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
  });
  if (invoiceErr) throw invoiceErr;

  const { data: invoice, error: fetchErr } = await supabase.from("sales_invoices").select("total").eq("id", invoiceId as string).single();
  if (fetchErr) throw fetchErr;

  const { error: payErr } = await supabase.rpc("record_sales_payment", {
    p_org_id: input.orgId,
    p_invoice_id: invoiceId as string,
    p_amount: invoice.total,
    p_method: input.paymentMethod,
  });
  if (payErr) throw payErr;

  const { error: tagErr } = await supabase.rpc("tag_invoice_pos_session", {
    p_org_id: input.orgId,
    p_invoice_id: invoiceId as string,
    p_session_id: input.sessionId,
  });
  if (tagErr) throw tagErr;

  return invoiceId as string;
}
