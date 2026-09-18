import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Customer {
  id: string;
  name: string;
  customer_type: "individual" | "business";
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  address: { city?: string; country?: string; street?: string };
  credit_limit: number | null;
  payment_terms_days: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export async function listCustomers(supabase: SupabaseClient, orgId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, customer_type, email, phone, tax_number, address, credit_limit, payment_terms_days, notes, is_active, created_at")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return data as unknown as Customer[];
}

export interface CustomerInput {
  name: string;
  customer_type: "individual" | "business";
  email: string;
  phone: string;
  tax_number: string;
  city: string;
  country: string;
  credit_limit: number | null;
  payment_terms_days: number | null;
  notes: string;
}

export async function createCustomer(supabase: SupabaseClient, orgId: string, input: CustomerInput) {
  const { error } = await supabase.from("customers").insert({
    org_id: orgId,
    name: input.name,
    customer_type: input.customer_type,
    email: input.email || null,
    phone: input.phone || null,
    tax_number: input.tax_number || null,
    address: { city: input.city || undefined, country: input.country || undefined },
    credit_limit: input.credit_limit,
    payment_terms_days: input.payment_terms_days,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateCustomer(supabase: SupabaseClient, customerId: string, input: CustomerInput) {
  const { error } = await supabase
    .from("customers")
    .update({
      name: input.name,
      customer_type: input.customer_type,
      email: input.email || null,
      phone: input.phone || null,
      tax_number: input.tax_number || null,
      address: { city: input.city || undefined, country: input.country || undefined },
      credit_limit: input.credit_limit,
      payment_terms_days: input.payment_terms_days,
      notes: input.notes || null,
    })
    .eq("id", customerId);
  if (error) throw error;
}

export async function setCustomerActive(supabase: SupabaseClient, customerId: string, isActive: boolean) {
  const { error } = await supabase.from("customers").update({ is_active: isActive }).eq("id", customerId);
  if (error) throw error;
}

// Bulk import — existing names are skipped so re-runs are safe.
export interface CustomerImportResult {
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ name: string; reason: string }>;
}

export async function importCustomers(
  supabase: SupabaseClient,
  orgId: string,
  rows: CustomerInput[]
): Promise<CustomerImportResult> {
  const { data: existing, error } = await supabase.from("customers").select("name").eq("org_id", orgId);
  if (error) throw error;

  const seen = new Set((existing ?? []).map((r: { name: string }) => r.name.toLowerCase()));
  const result: CustomerImportResult = { created: 0, skipped: 0, failed: 0, errors: [] };

  for (const row of rows) {
    if (seen.has(row.name.toLowerCase())) {
      result.skipped += 1;
      continue;
    }
    try {
      await createCustomer(supabase, orgId, row);
      seen.add(row.name.toLowerCase());
      result.created += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ name: row.name || "(no name)", reason: (err as Error).message });
    }
  }

  return result;
}

// ============================================================
// Customer 360 — everything about one account on one screen:
// profile/terms, AR position, invoice history, recent payments.
// ============================================================

export interface CustomerDetail extends Customer {
  totalBilled: number;
  totalPaid: number;
  openBalance: number;
  overdueBalance: number;
  invoices: Array<{
    id: string;
    invoice_number: string;
    status: string;
    total: number;
    amount_paid: number;
    due_date: string | null;
    created_at: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    paid_at: string;
    reference: string | null;
    invoice_number: string;
  }>;
}

export async function getCustomerDetail(
  supabase: SupabaseClient,
  orgId: string,
  customerId: string
): Promise<CustomerDetail | null> {
  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, customer_type, email, phone, tax_number, address, credit_limit, payment_terms_days, notes, is_active, created_at")
    .eq("org_id", orgId)
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw error;
  if (!customer) return null;

  const { data: invoices, error: invError } = await supabase
    .from("sales_invoices")
    .select("id, invoice_number, status, total, amount_paid, due_date, created_at")
    .eq("org_id", orgId)
    .eq("customer_id", customerId)
    .eq("doc_type", "invoice")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (invError) throw invError;

  const invoiceRows = (invoices ?? []) as CustomerDetail["invoices"];
  const today = new Date().toISOString().slice(0, 10);

  const invoiceIds = invoiceRows.map((i) => i.id);
  let recentPayments: CustomerDetail["recentPayments"] = [];
  if (invoiceIds.length > 0) {
    const { data: payments, error: payError } = await supabase
      .from("sales_payments")
      .select("id, amount, method, paid_at, reference, invoice_id")
      .in("invoice_id", invoiceIds)
      .order("paid_at", { ascending: false })
      .limit(10);
    if (payError) throw payError;

    const numberById = new Map(invoiceRows.map((i) => [i.id, i.invoice_number]));
    recentPayments = ((payments ?? []) as Array<{
      id: string;
      amount: number;
      method: string;
      paid_at: string;
      reference: string | null;
      invoice_id: string;
    }>).map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      paid_at: p.paid_at,
      reference: p.reference,
      invoice_number: numberById.get(p.invoice_id) ?? "",
    }));
  }

  const open = invoiceRows.filter((i) => i.status === "issued" || i.status === "partially_paid");

  return {
    ...(customer as unknown as Customer),
    totalBilled: invoiceRows.reduce((sum, i) => sum + i.total, 0),
    totalPaid: invoiceRows.reduce((sum, i) => sum + i.amount_paid, 0),
    openBalance: open.reduce((sum, i) => sum + (i.total - i.amount_paid), 0),
    overdueBalance: open
      .filter((i) => i.due_date !== null && i.due_date < today)
      .reduce((sum, i) => sum + (i.total - i.amount_paid), 0),
    invoices: invoiceRows,
    recentPayments,
  };
}
