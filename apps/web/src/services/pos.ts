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
    discountTotal?: number;
    discountReason?: string;
    /** One or more tenders; must sum to the invoice total. Empty = single cash payment. */
    payments?: Array<{ method: string; amount: number }>;
    paymentMethod?: string;
  }
): Promise<string> {
  const { data: invoiceId, error: invoiceErr } = await supabase.rpc("create_sales_invoice", {
    p_org_id: input.orgId,
    p_branch_id: input.branchId,
    p_customer_id: input.customerId ?? undefined,
    p_warehouse_id: input.warehouseId,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
    p_discount_total: input.discountTotal ?? 0,
    p_discount_reason: input.discountReason || undefined,
  });
  if (invoiceErr) throw invoiceErr;

  const { data: invoice, error: fetchErr } = await supabase.from("sales_invoices").select("total").eq("id", invoiceId as string).single();
  if (fetchErr) throw fetchErr;

  const payments =
    input.payments && input.payments.length > 0
      ? input.payments
      : [{ method: input.paymentMethod ?? "cash", amount: invoice.total }];

  for (const payment of payments) {
    const { error: payErr } = await supabase.rpc("record_sales_payment", {
      p_org_id: input.orgId,
      p_invoice_id: invoiceId as string,
      p_amount: payment.amount,
      p_method: payment.method,
    });
    if (payErr) throw payErr;
  }

  const { error: tagErr } = await supabase.rpc("tag_invoice_pos_session", {
    p_org_id: input.orgId,
    p_invoice_id: invoiceId as string,
    p_session_id: input.sessionId,
  });
  if (tagErr) throw tagErr;

  return invoiceId as string;
}

// ============================================================
// Held orders — park the current cart against the open session so a
// customer can step aside; resume wipes the hold.
// ============================================================

export interface HeldOrder {
  id: string;
  label: string | null;
  customer_id: string | null;
  cart: Array<{ product_id: string; name: string; unit_price: number; quantity: number }>;
  held_by_name: string | null;
  created_at: string;
}

export async function listHeldOrders(
  supabase: SupabaseClient,
  orgId: string,
  sessionId: string
): Promise<HeldOrder[]> {
  const { data, error } = await supabase
    .from("pos_held_orders")
    .select("id, label, customer_id, cart, created_at, profiles(full_name)")
    .eq("org_id", orgId)
    .eq("session_id", sessionId)
    .order("created_at");
  if (error) throw error;

  return (
    (data ?? []) as unknown as Array<{
      id: string;
      label: string | null;
      customer_id: string | null;
      cart: HeldOrder["cart"];
      created_at: string;
      profiles: { full_name: string | null } | null;
    }>
  ).map((row) => ({
    id: row.id,
    label: row.label,
    customer_id: row.customer_id,
    cart: row.cart ?? [],
    held_by_name: row.profiles?.full_name ?? null,
    created_at: row.created_at,
  }));
}

export async function holdOrder(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    sessionId: string;
    registerId: string;
    customerId: string | null;
    label: string;
    cart: HeldOrder["cart"];
  }
) {
  const { error } = await supabase.from("pos_held_orders").insert({
    org_id: input.orgId,
    session_id: input.sessionId,
    register_id: input.registerId,
    customer_id: input.customerId,
    label: input.label || null,
    cart: input.cart as unknown as Json,
    held_by: (await supabase.auth.getUser()).data.user?.id,
  });
  if (error) throw error;
}

export async function deleteHeldOrder(supabase: SupabaseClient, heldOrderId: string) {
  const { error } = await supabase.from("pos_held_orders").delete().eq("id", heldOrderId);
  if (error) throw error;
}

// ============================================================
// Session history — closed shifts with a computed Z-report:
// expected cash = opening float + cash takings; variance is what
// the cashier counted minus what the till says should be there.
// ============================================================

export interface SessionHistoryRow {
  id: string;
  opened_at: string;
  closed_at: string | null;
  openedByName: string | null;
  opening_float: number;
  closing_float: number | null;
  invoiceCount: number;
  totalSales: number;
  cashSales: number;
  expectedCash: number;
  variance: number | null;
}

export async function listSessionHistory(
  supabase: SupabaseClient,
  orgId: string,
  registerId: string,
  limit = 10
): Promise<SessionHistoryRow[]> {
  const { data: sessions, error } = await supabase
    .from("pos_sessions")
    .select("id, opening_float, closing_float, opened_at, closed_at, profiles(full_name)")
    .eq("org_id", orgId)
    .eq("register_id", registerId)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (sessions ?? []) as unknown as Array<{
    id: string;
    opening_float: number;
    closing_float: number | null;
    opened_at: string;
    closed_at: string | null;
    profiles: { full_name: string | null } | null;
  }>;
  if (rows.length === 0) return [];

  const sessionIds = rows.map((s) => s.id);
  const { data: invoices, error: invError } = await supabase
    .from("sales_invoices")
    .select("id, total, pos_session_id")
    .eq("org_id", orgId)
    .in("pos_session_id", sessionIds);
  if (invError) throw invError;

  const invoiceRows = (invoices ?? []) as Array<{ id: string; total: number; pos_session_id: string | null }>;
  const invoiceIds = invoiceRows.map((i) => i.id);

  const cashBySession = new Map<string, number>();
  if (invoiceIds.length > 0) {
    const { data: payments, error: payError } = await supabase
      .from("sales_payments")
      .select("invoice_id, amount, method")
      .in("invoice_id", invoiceIds);
    if (payError) throw payError;

    const sessionByInvoice = new Map(invoiceRows.map((i) => [i.id, i.pos_session_id]));
    for (const p of (payments ?? []) as Array<{ invoice_id: string; amount: number; method: string }>) {
      if (p.method !== "cash") continue;
      const sid = sessionByInvoice.get(p.invoice_id);
      if (sid) cashBySession.set(sid, (cashBySession.get(sid) ?? 0) + p.amount);
    }
  }

  return rows.map((s) => {
    const sessionInvoices = invoiceRows.filter((i) => i.pos_session_id === s.id);
    const totalSales = sessionInvoices.reduce((sum, i) => sum + i.total, 0);
    const cashSales = cashBySession.get(s.id) ?? 0;
    const expectedCash = s.opening_float + cashSales;
    return {
      id: s.id,
      opened_at: s.opened_at,
      closed_at: s.closed_at,
      openedByName: s.profiles?.full_name ?? null,
      opening_float: s.opening_float,
      closing_float: s.closing_float,
      invoiceCount: sessionInvoices.length,
      totalSales,
      cashSales,
      expectedCash,
      variance: s.closing_float !== null ? s.closing_float - expectedCash : null,
    };
  });
}
