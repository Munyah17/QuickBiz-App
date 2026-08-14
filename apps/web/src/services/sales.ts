import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Json } from "@quickbiz/supabase/database.types";

export interface InvoiceListRow {
  id: string;
  invoice_number: string;
  customerName: string | null;
  status: "draft" | "issued" | "paid" | "cancelled";
  total: number;
  amount_paid: number;
  created_at: string;
}

export async function listInvoices(supabase: SupabaseClient, orgId: string): Promise<InvoiceListRow[]> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select("id, invoice_number, status, total, amount_paid, created_at, customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      invoice_number: string;
      status: InvoiceListRow["status"];
      total: number;
      amount_paid: number;
      created_at: string;
      customers: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    invoice_number: row.invoice_number,
    customerName: row.customers?.name ?? null,
    status: row.status,
    total: row.total,
    amount_paid: row.amount_paid,
    created_at: row.created_at,
  }));
}

export interface InvoiceDetail {
  id: string;
  invoice_number: string;
  status: "draft" | "issued" | "paid" | "cancelled";
  customerName: string | null;
  branchName: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  currency: string;
  notes: string | null;
  created_at: string;
  items: Array<{ id: string; description: string; quantity: number; unit_price: number; line_total: number }>;
  payments: Array<{ id: string; amount: number; method: string; paid_at: string; reference: string | null }>;
}

export async function getInvoiceDetail(
  supabase: SupabaseClient,
  orgId: string,
  invoiceId: string
): Promise<InvoiceDetail | null> {
  const { data: invoice, error } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, status, subtotal, tax_total, total, amount_paid, currency, notes, created_at, customers(name), branches(name)"
    )
    .eq("org_id", orgId)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) throw error;
  if (!invoice) return null;

  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("sales_invoice_items").select("id, description, quantity, unit_price, line_total").eq("invoice_id", invoiceId),
    supabase.from("sales_payments").select("id, amount, method, paid_at, reference").eq("invoice_id", invoiceId).order("paid_at"),
  ]);

  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;

  const row = invoice as unknown as {
    id: string;
    invoice_number: string;
    status: InvoiceDetail["status"];
    subtotal: number;
    tax_total: number;
    total: number;
    amount_paid: number;
    currency: string;
    notes: string | null;
    created_at: string;
    customers: { name: string } | null;
    branches: { name: string } | null;
  };

  return {
    id: row.id,
    invoice_number: row.invoice_number,
    status: row.status,
    customerName: row.customers?.name ?? null,
    branchName: row.branches?.name ?? null,
    subtotal: row.subtotal,
    tax_total: row.tax_total,
    total: row.total,
    amount_paid: row.amount_paid,
    currency: row.currency,
    notes: row.notes,
    created_at: row.created_at,
    items: (items ?? []) as InvoiceDetail["items"],
    payments: (payments ?? []) as InvoiceDetail["payments"],
  };
}

export interface InvoiceLineInput {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export async function createInvoice(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    branchId: string;
    customerId: string | null;
    warehouseId: string | null;
    items: InvoiceLineInput[];
    taxTotal: number;
    notes: string;
  }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_sales_invoice", {
    p_org_id: input.orgId,
    p_branch_id: input.branchId,
    p_customer_id: input.customerId ?? undefined,
    p_warehouse_id: input.warehouseId ?? undefined,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
    p_notes: input.notes || undefined,
  });
  if (error) throw error;
  return data as string;
}

export interface SalesDashboardStats {
  invoiceCount: number;
  totalSales: number;
  outstanding: number;
}

export async function getSalesStats(supabase: SupabaseClient, orgId: string): Promise<SalesDashboardStats> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select("total, amount_paid")
    .eq("org_id", orgId)
    .neq("status", "cancelled");
  if (error) throw error;

  const rows = (data ?? []) as Array<{ total: number; amount_paid: number }>;
  return {
    invoiceCount: rows.length,
    totalSales: rows.reduce((sum, r) => sum + r.total, 0),
    outstanding: rows.reduce((sum, r) => sum + (r.total - r.amount_paid), 0),
  };
}

export async function recordPayment(
  supabase: SupabaseClient,
  input: { orgId: string; invoiceId: string; amount: number; method: string; reference: string }
) {
  const { error } = await supabase.rpc("record_sales_payment", {
    p_org_id: input.orgId,
    p_invoice_id: input.invoiceId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference || undefined,
  });
  if (error) throw error;
}
