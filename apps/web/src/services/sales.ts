import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Json } from "@quickbiz/supabase/database.types";

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
export type SalesDocType = "invoice" | "quote" | "debit_note" | "boq";

export interface InvoiceListRow {
  id: string;
  invoice_number: string;
  customerName: string | null;
  status: InvoiceStatus;
  doc_type: SalesDocType;
  total: number;
  amount_paid: number;
  due_date: string | null;
  created_at: string;
}

/** Overdue = issued/partially_paid with a due date in the past and money still owed. */
export function isOverdue(inv: Pick<InvoiceListRow, "status" | "due_date" | "total" | "amount_paid">): boolean {
  return (
    (inv.status === "issued" || inv.status === "partially_paid") &&
    inv.due_date !== null &&
    inv.due_date < new Date().toISOString().slice(0, 10) &&
    inv.total - inv.amount_paid > 0
  );
}

export async function listInvoices(supabase: SupabaseClient, orgId: string): Promise<InvoiceListRow[]> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select("id, invoice_number, status, doc_type, total, amount_paid, due_date, created_at, customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      invoice_number: string;
      status: InvoiceStatus;
      doc_type: SalesDocType;
      total: number;
      amount_paid: number;
      due_date: string | null;
      created_at: string;
      customers: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    invoice_number: row.invoice_number,
    customerName: row.customers?.name ?? null,
    status: row.status,
    doc_type: row.doc_type,
    total: row.total,
    amount_paid: row.amount_paid,
    due_date: row.due_date,
    created_at: row.created_at,
  }));
}

export interface InvoiceDetail {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  doc_type: SalesDocType;
  customerId: string | null;
  customerName: string | null;
  branchName: string | null;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  discount_reason: string | null;
  shipping_total: number;
  total: number;
  amount_paid: number;
  currency: string;
  notes: string | null;
  due_date: string | null;
  invoice_date: string;
  reference: string | null;
  salesperson: string | null;
  payment_terms: string | null;
  billing_address: string | null;
  delivery_address: string | null;
  issued_at: string | null;
  created_at: string;
  items: Array<{
    id: string;
    product_id: string | null;
    description: string;
    sku: string | null;
    unit: string | null;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number | null;
    line_total: number;
  }>;
  payments: Array<{ id: string; amount: number; method: string; paid_at: string; reference: string | null }>;
  creditNotes: Array<{ id: string; credit_note_number: string; status: string; subtotal: number; reason: string | null; created_at: string }>;
}

export async function getInvoiceDetail(
  supabase: SupabaseClient,
  orgId: string,
  invoiceId: string
): Promise<InvoiceDetail | null> {
  const { data: invoice, error } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, status, doc_type, customer_id, subtotal, tax_total, discount_total, discount_reason, shipping_total, total, amount_paid, currency, notes, due_date, invoice_date, reference, salesperson, payment_terms, billing_address, delivery_address, issued_at, created_at, customers(name), branches(name)"
    )
    .eq("org_id", orgId)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) throw error;
  if (!invoice) return null;

  const [
    { data: items, error: itemsError },
    { data: payments, error: paymentsError },
    { data: creditNotes, error: cnError },
  ] = await Promise.all([
    supabase.from("sales_invoice_items").select("id, product_id, description, sku, unit, quantity, unit_price, discount, tax_rate, line_total").eq("invoice_id", invoiceId),
    supabase.from("sales_payments").select("id, amount, method, paid_at, reference").eq("invoice_id", invoiceId).order("paid_at"),
    supabase
      .from("sales_credit_notes")
      .select("id, credit_note_number, status, subtotal, reason, created_at")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false }),
  ]);

  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;
  if (cnError) throw cnError;

  const row = invoice as unknown as {
    id: string;
    invoice_number: string;
    status: InvoiceStatus;
    doc_type: SalesDocType;
    customer_id: string | null;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    discount_reason: string | null;
    shipping_total: number;
    total: number;
    amount_paid: number;
    currency: string;
    notes: string | null;
    due_date: string | null;
    invoice_date: string;
    reference: string | null;
    salesperson: string | null;
    payment_terms: string | null;
    billing_address: string | null;
    delivery_address: string | null;
    issued_at: string | null;
    created_at: string;
    customers: { name: string } | null;
    branches: { name: string } | null;
  };

  return {
    id: row.id,
    invoice_number: row.invoice_number,
    status: row.status,
    doc_type: row.doc_type,
    customerId: row.customer_id,
    customerName: row.customers?.name ?? null,
    branchName: row.branches?.name ?? null,
    subtotal: row.subtotal,
    tax_total: row.tax_total,
    discount_total: row.discount_total,
    discount_reason: row.discount_reason,
    shipping_total: row.shipping_total,
    total: row.total,
    amount_paid: row.amount_paid,
    currency: row.currency,
    notes: row.notes,
    due_date: row.due_date,
    invoice_date: row.invoice_date,
    reference: row.reference,
    salesperson: row.salesperson,
    payment_terms: row.payment_terms,
    billing_address: row.billing_address,
    delivery_address: row.delivery_address,
    issued_at: row.issued_at,
    created_at: row.created_at,
    items: (items ?? []) as InvoiceDetail["items"],
    payments: (payments ?? []) as InvoiceDetail["payments"],
    creditNotes: (creditNotes ?? []) as InvoiceDetail["creditNotes"],
  };
}

export interface InvoiceLineInput {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  sku?: string | null;
  unit?: string | null;
  discount?: number;
  tax_rate?: number | null;
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
    dueDate?: string | null;
    discountTotal?: number;
    discountReason?: string;
    status?: "draft" | "issued";
    docType?: SalesDocType;
    invoiceDate?: string | null;
    reference?: string;
    salesperson?: string;
    paymentTerms?: string;
    shippingTotal?: number;
    billingAddress?: string;
    deliveryAddress?: string;
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
    p_due_date: input.dueDate ?? undefined,
    p_discount_total: input.discountTotal ?? 0,
    p_discount_reason: input.discountReason || undefined,
    p_status: input.status ?? "issued",
    p_doc_type: input.docType ?? "invoice",
    p_invoice_date: input.invoiceDate ?? undefined,
    p_reference: input.reference || undefined,
    p_salesperson: input.salesperson || undefined,
    p_payment_terms: input.paymentTerms || undefined,
    p_shipping_total: input.shippingTotal ?? 0,
    p_billing_address: input.billingAddress || undefined,
    p_delivery_address: input.deliveryAddress || undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function issueInvoice(supabase: SupabaseClient, orgId: string, invoiceId: string) {
  const { error } = await supabase.rpc("issue_invoice", { p_org_id: orgId, p_invoice_id: invoiceId });
  if (error) throw error;
}

export async function convertQuoteToInvoice(supabase: SupabaseClient, orgId: string, quoteId: string) {
  const { error } = await supabase.rpc("convert_quote_to_invoice", { p_org_id: orgId, p_quote_id: quoteId });
  if (error) throw error;
}

/** Replace the lines and header fields of a draft invoice/quotation. */
export async function updateDraftInvoice(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    invoiceId: string;
    customerId: string | null;
    items: InvoiceLineInput[];
    taxTotal: number;
    notes: string;
    dueDate?: string | null;
    discountTotal?: number;
    discountReason?: string;
    invoiceDate?: string | null;
    reference?: string;
    salesperson?: string;
    paymentTerms?: string;
    shippingTotal?: number;
    billingAddress?: string;
    deliveryAddress?: string;
  }
) {
  const { error } = await supabase.rpc("update_draft_invoice", {
    p_org_id: input.orgId,
    p_invoice_id: input.invoiceId,
    p_customer_id: input.customerId ?? undefined,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
    p_notes: input.notes || undefined,
    p_due_date: input.dueDate ?? undefined,
    p_discount_total: input.discountTotal ?? 0,
    p_discount_reason: input.discountReason || undefined,
    p_invoice_date: input.invoiceDate ?? undefined,
    p_reference: input.reference || undefined,
    p_salesperson: input.salesperson || undefined,
    p_payment_terms: input.paymentTerms || undefined,
    p_shipping_total: input.shippingTotal ?? 0,
    p_billing_address: input.billingAddress || undefined,
    p_delivery_address: input.deliveryAddress || undefined,
  });
  if (error) throw error;
}

/**
 * Copy an invoice into a new draft — same customer, lines, discount and
 * terms, but no payments and no stock movement (drafts don't decrement;
 * issue_invoice deducts when it's actually sent out).
 */
export async function duplicateInvoice(
  supabase: SupabaseClient,
  orgId: string,
  invoiceId: string
): Promise<string> {
  const { data: source, error } = await supabase
    .from("sales_invoices")
    .select("branch_id, customer_id, tax_total, notes, due_date, discount_total, discount_reason, doc_type, invoice_date, reference, salesperson, payment_terms, shipping_total, billing_address, delivery_address")
    .eq("org_id", orgId)
    .eq("id", invoiceId)
    .single();
  if (error) throw error;

  const { data: items, error: itemsError } = await supabase
    .from("sales_invoice_items")
    .select("product_id, description, sku, unit, quantity, unit_price, discount, tax_rate")
    .eq("invoice_id", invoiceId);
  if (itemsError) throw itemsError;

  const row = source as unknown as {
    branch_id: string;
    customer_id: string | null;
    tax_total: number;
    notes: string | null;
    due_date: string | null;
    discount_total: number;
    discount_reason: string | null;
    doc_type: SalesDocType;
    invoice_date: string | null;
    reference: string | null;
    salesperson: string | null;
    payment_terms: string | null;
    shipping_total: number;
    billing_address: string | null;
    delivery_address: string | null;
  };

  const { data: newId, error: createError } = await supabase.rpc("create_sales_invoice", {
    p_org_id: orgId,
    p_branch_id: row.branch_id,
    p_customer_id: row.customer_id ?? undefined,
    p_items: ((items ?? []) as Array<{
      product_id: string | null;
      description: string;
      sku: string | null;
      unit: string | null;
      quantity: number;
      unit_price: number;
      discount: number;
      tax_rate: number | null;
    }>).map(
      (i) => ({
        product_id: i.product_id,
        description: i.description,
        sku: i.sku,
        unit: i.unit,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        tax_rate: i.tax_rate,
      })
    ) as unknown as Json,
    p_tax_total: row.tax_total,
    p_notes: row.notes || undefined,
    p_due_date: row.due_date ?? undefined,
    p_discount_total: row.discount_total,
    p_discount_reason: row.discount_reason || undefined,
    p_status: "draft",
    p_doc_type: row.doc_type,
    p_invoice_date: row.invoice_date ?? undefined,
    p_reference: row.reference || undefined,
    p_salesperson: row.salesperson || undefined,
    p_payment_terms: row.payment_terms || undefined,
    p_shipping_total: row.shipping_total,
    p_billing_address: row.billing_address || undefined,
    p_delivery_address: row.delivery_address || undefined,
  });
  if (createError) throw createError;
  return newId as string;
}

export async function voidInvoice(supabase: SupabaseClient, orgId: string, invoiceId: string, reason: string) {
  const { error } = await supabase.rpc("void_invoice", {
    p_org_id: orgId,
    p_invoice_id: invoiceId,
    p_reason: reason || undefined,
  });
  if (error) throw error;
}

export async function createCreditNote(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    invoiceId: string;
    items: InvoiceLineInput[];
    reason: string;
    restock: boolean;
  }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_credit_note", {
    p_org_id: input.orgId,
    p_invoice_id: input.invoiceId,
    p_items: input.items as unknown as Json,
    p_reason: input.reason || undefined,
    p_restock: input.restock,
  });
  if (error) throw error;
  return data as string;
}

export async function applyCreditNote(supabase: SupabaseClient, orgId: string, creditNoteId: string) {
  const { error } = await supabase.rpc("apply_credit_note", { p_org_id: orgId, p_credit_note_id: creditNoteId });
  if (error) throw error;
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
    .in("doc_type", ["invoice", "debit_note"])
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
  input: { orgId: string; invoiceId: string; amount: number; method: string; reference: string; proofUrl?: string }
) {
  const { error } = await supabase.rpc("record_sales_payment", {
    p_org_id: input.orgId,
    p_invoice_id: input.invoiceId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference || undefined,
    p_proof_url: input.proofUrl || undefined,
  });
  if (error) throw error;
}

// ============================================================
// Accounts receivable
// ============================================================

/** Lazy overdue sweep — stamps + notifies once per invoice. Safe to call on every page load. */
export async function checkOverdueInvoices(supabase: SupabaseClient, orgId: string) {
  const { error } = await supabase.rpc("check_overdue_invoices", { p_org_id: orgId });
  if (error) throw error;
}

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
}

export interface ARAgingRow {
  customerId: string;
  customerName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

/** Classic AR aging: open balances bucketed by days past due date. */
export async function getARAging(supabase: SupabaseClient, orgId: string): Promise<ARAgingRow[]> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select("customer_id, total, amount_paid, due_date, customers(name)")
    .eq("org_id", orgId)
    .in("doc_type", ["invoice", "debit_note"])
    .in("status", ["issued", "partially_paid"]);
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const byCustomer = new Map<string, ARAgingRow>();

  for (const row of (data ?? []) as unknown as Array<{
    customer_id: string | null;
    total: number;
    amount_paid: number;
    due_date: string | null;
    customers: { name: string } | null;
  }>) {
    const balance = row.total - row.amount_paid;
    if (balance <= 0) continue;

    const key = row.customer_id ?? "walk-in";
    const entry =
      byCustomer.get(key) ??
      {
        customerId: key,
        customerName: row.customers?.name ?? "Walk-in / no customer",
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        total: 0,
      };

    const daysPastDue = row.due_date ? Math.floor((Date.parse(today) - Date.parse(row.due_date)) / 86400000) : 0;
    if (daysPastDue <= 0) entry.current += balance;
    else if (daysPastDue <= 30) entry.days1to30 += balance;
    else if (daysPastDue <= 60) entry.days31to60 += balance;
    else if (daysPastDue <= 90) entry.days61to90 += balance;
    else entry.over90 += balance;
    entry.total += balance;

    byCustomer.set(key, entry);
  }

  return Array.from(byCustomer.values()).sort((a, b) => b.total - a.total);
}
