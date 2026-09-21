import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Json } from "@quickbiz/supabase/database.types";

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  address: { city?: string; country?: string };
  is_active: boolean;
}

export async function listSuppliers(supabase: SupabaseClient, orgId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, email, phone, tax_number, address, is_active")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return data as unknown as Supplier[];
}

export interface SupplierInput {
  name: string;
  email: string;
  phone: string;
  tax_number: string;
  city: string;
  country: string;
}

export async function createSupplier(supabase: SupabaseClient, orgId: string, input: SupplierInput) {
  const { error } = await supabase.from("suppliers").insert({
    org_id: orgId,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    tax_number: input.tax_number || null,
    address: { city: input.city || undefined, country: input.country || undefined },
  });
  if (error) throw error;
}

export async function updateSupplier(supabase: SupabaseClient, supplierId: string, input: SupplierInput) {
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      tax_number: input.tax_number || null,
      address: { city: input.city || undefined, country: input.country || undefined },
    })
    .eq("id", supplierId);
  if (error) throw error;
}

export async function setSupplierActive(supabase: SupabaseClient, supplierId: string, isActive: boolean) {
  const { error } = await supabase.from("suppliers").update({ is_active: isActive }).eq("id", supplierId);
  if (error) throw error;
}

// Bulk import — existing names are skipped so re-runs are safe.
export interface SupplierImportResult {
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ name: string; reason: string }>;
}

export async function importSuppliers(
  supabase: SupabaseClient,
  orgId: string,
  rows: SupplierInput[]
): Promise<SupplierImportResult> {
  const { data: existing, error } = await supabase.from("suppliers").select("name").eq("org_id", orgId);
  if (error) throw error;

  const seen = new Set((existing ?? []).map((r: { name: string }) => r.name.toLowerCase()));
  const result: SupplierImportResult = { created: 0, skipped: 0, failed: 0, errors: [] };

  for (const row of rows) {
    if (seen.has(row.name.toLowerCase())) {
      result.skipped += 1;
      continue;
    }
    try {
      await createSupplier(supabase, orgId, row);
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
// Supplier 360 — account position: total spend, what we still owe,
// full PO history, and recent payments.
// ============================================================

export interface SupplierDetail extends Supplier {
  totalSpend: number;
  totalPaid: number;
  openBalance: number;
  lateOrders: number;
  purchaseOrders: Array<{
    id: string;
    po_number: string;
    status: string;
    total: number;
    amount_paid: number;
    expected_date: string | null;
    created_at: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    paid_at: string;
    reference: string | null;
    po_number: string;
  }>;
}

export async function getSupplierDetail(
  supabase: SupabaseClient,
  orgId: string,
  supplierId: string
): Promise<SupplierDetail | null> {
  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select("id, name, email, phone, tax_number, address, is_active")
    .eq("org_id", orgId)
    .eq("id", supplierId)
    .maybeSingle();
  if (error) throw error;
  if (!supplier) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, total, amount_paid, expected_date, created_at")
    .eq("org_id", orgId)
    .eq("supplier_id", supplierId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (ordersError) throw ordersError;

  const orderRows = (orders ?? []) as SupplierDetail["purchaseOrders"];
  const today = new Date().toISOString().slice(0, 10);

  const poIds = orderRows.map((o) => o.id);
  let recentPayments: SupplierDetail["recentPayments"] = [];
  if (poIds.length > 0) {
    const { data: payments, error: payError } = await supabase
      .from("purchase_payments")
      .select("id, amount, method, paid_at, reference, po_id")
      .in("po_id", poIds)
      .order("paid_at", { ascending: false })
      .limit(10);
    if (payError) throw payError;

    const numberById = new Map(orderRows.map((o) => [o.id, o.po_number]));
    recentPayments = ((payments ?? []) as Array<{
      id: string;
      amount: number;
      method: string;
      paid_at: string;
      reference: string | null;
      po_id: string;
    }>).map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      paid_at: p.paid_at,
      reference: p.reference,
      po_number: numberById.get(p.po_id) ?? "",
    }));
  }

  const open = orderRows.filter((o) => o.status === "issued");

  return {
    ...(supplier as unknown as Supplier),
    totalSpend: orderRows.reduce((sum, o) => sum + o.total, 0),
    totalPaid: orderRows.reduce((sum, o) => sum + o.amount_paid, 0),
    openBalance: open.reduce((sum, o) => sum + (o.total - o.amount_paid), 0),
    lateOrders: open.filter((o) => o.expected_date !== null && o.expected_date < today).length,
    purchaseOrders: orderRows,
    recentPayments,
  };
}

export interface PurchaseOrderListRow {
  id: string;
  po_number: string;
  supplierName: string | null;
  status: "draft" | "issued" | "received" | "cancelled";
  total: number;
  amount_paid: number;
  expected_date: string | null;
  buyer_name: string | null;
  created_at: string;
}

export async function listPurchaseOrders(supabase: SupabaseClient, orgId: string): Promise<PurchaseOrderListRow[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, total, amount_paid, expected_date, buyer_name, created_at, suppliers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      po_number: string;
      status: PurchaseOrderListRow["status"];
      total: number;
      amount_paid: number;
      expected_date: string | null;
      buyer_name: string | null;
      created_at: string;
      suppliers: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    po_number: row.po_number,
    supplierName: row.suppliers?.name ?? null,
    status: row.status,
    total: row.total,
    amount_paid: row.amount_paid,
    expected_date: row.expected_date,
    buyer_name: row.buyer_name,
    created_at: row.created_at,
  }));
}

export interface PurchaseOrderDetail {
  id: string;
  po_number: string;
  status: "draft" | "issued" | "received" | "cancelled";
  supplierName: string | null;
  branchName: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  received_at: string | null;
  expected_date: string | null;
  items: Array<{ id: string; description: string; quantity: number; unit_cost: number; line_total: number }>;
  payments: Array<{ id: string; amount: number; method: string; paid_at: string; reference: string | null }>;
}

export async function getPurchaseOrderDetail(supabase: SupabaseClient, orgId: string, poId: string): Promise<PurchaseOrderDetail | null> {
  const { data: po, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, po_number, status, subtotal, tax_total, total, amount_paid, notes, created_at, received_at, expected_date, suppliers(name), branches(name)"
    )
    .eq("org_id", orgId)
    .eq("id", poId)
    .maybeSingle();
  if (error) throw error;
  if (!po) return null;

  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("purchase_order_items").select("id, description, quantity, unit_cost, line_total").eq("po_id", poId),
    supabase.from("purchase_payments").select("id, amount, method, paid_at, reference").eq("po_id", poId).order("paid_at"),
  ]);
  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;

  const row = po as unknown as {
    id: string;
    po_number: string;
    status: PurchaseOrderDetail["status"];
    subtotal: number;
    tax_total: number;
    total: number;
    amount_paid: number;
    notes: string | null;
    created_at: string;
    received_at: string | null;
    expected_date: string | null;
    suppliers: { name: string } | null;
    branches: { name: string } | null;
  };

  return {
    id: row.id,
    po_number: row.po_number,
    status: row.status,
    supplierName: row.suppliers?.name ?? null,
    branchName: row.branches?.name ?? null,
    subtotal: row.subtotal,
    tax_total: row.tax_total,
    total: row.total,
    amount_paid: row.amount_paid,
    notes: row.notes,
    created_at: row.created_at,
    received_at: row.received_at,
    expected_date: row.expected_date,
    items: (items ?? []) as PurchaseOrderDetail["items"],
    payments: (payments ?? []) as PurchaseOrderDetail["payments"],
  };
}

export interface PurchaseOrderLineInput {
  product_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
}

export async function createPurchaseOrder(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    branchId: string;
    supplierId: string | null;
    items: PurchaseOrderLineInput[];
    taxTotal: number;
    notes: string;
    expectedDate?: string | null;
    buyerName?: string;
  }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_purchase_order", {
    p_org_id: input.orgId,
    p_branch_id: input.branchId,
    p_supplier_id: input.supplierId ?? undefined,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
    p_notes: input.notes || undefined,
    p_expected_date: input.expectedDate ?? undefined,
  });
  if (error) throw error;
  const poId = data as string;

  // buyer_name isn't an RPC param — set it directly (purchasing.manage write
  // policy covers the update).
  if (input.buyerName) {
    const { error: buyerError } = await supabase
      .from("purchase_orders")
      .update({ buyer_name: input.buyerName })
      .eq("id", poId);
    if (buyerError) throw buyerError;
  }
  return poId;
}

export async function receivePurchaseOrder(supabase: SupabaseClient, orgId: string, poId: string, warehouseId: string) {
  const { error } = await supabase.rpc("receive_purchase_order", { p_org_id: orgId, p_po_id: poId, p_warehouse_id: warehouseId });
  if (error) throw error;
}

export async function recordPurchasePayment(
  supabase: SupabaseClient,
  input: { orgId: string; poId: string; amount: number; method: string; reference: string; proofUrl?: string }
) {
  const { error } = await supabase.rpc("record_purchase_payment", {
    p_org_id: input.orgId,
    p_po_id: input.poId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference || undefined,
    p_proof_url: input.proofUrl || undefined,
  });
  if (error) throw error;
}

// ============================================================
// Creditors — AP aging: what we owe each supplier, bucketed by
// days past the PO's expected date.
// ============================================================

export interface APAgingRow {
  supplierId: string;
  supplierName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

export async function getAPAging(supabase: SupabaseClient, orgId: string): Promise<APAgingRow[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("supplier_id, total, amount_paid, expected_date, created_at, suppliers(name)")
    .eq("org_id", orgId)
    .in("status", ["issued", "received"]);
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const bySupplier = new Map<string, APAgingRow>();

  for (const row of (data ?? []) as unknown as Array<{
    supplier_id: string | null;
    total: number;
    amount_paid: number;
    expected_date: string | null;
    created_at: string;
    suppliers: { name: string } | null;
  }>) {
    const balance = row.total - row.amount_paid;
    if (balance <= 0) continue;

    const key = row.supplier_id ?? "none";
    const existing = bySupplier.get(key) ?? {
      supplierId: key,
      supplierName: row.suppliers?.name ?? "No supplier",
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
      total: 0,
    };

    // Age from expected_date when set, otherwise from PO creation.
    const ref = row.expected_date ?? row.created_at.slice(0, 10);
    const daysPast = Math.floor((Date.parse(today) - Date.parse(ref)) / 86400000);
    if (daysPast <= 0) existing.current += balance;
    else if (daysPast <= 30) existing.days1to30 += balance;
    else if (daysPast <= 60) existing.days31to60 += balance;
    else if (daysPast <= 90) existing.days61to90 += balance;
    else existing.over90 += balance;
    existing.total += balance;
    bySupplier.set(key, existing);
  }

  return [...bySupplier.values()].sort((a, b) => b.total - a.total);
}

// ============================================================
// Purchase requisitions — internal ask → approve → convert to PO.
// ============================================================

export type RequisitionStatus = "pending" | "approved" | "rejected" | "converted" | "cancelled";

export interface RequisitionItem {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  estimated_cost: number;
}

export interface Requisition {
  id: string;
  requisition_number: string;
  status: RequisitionStatus;
  needed_by: string | null;
  justification: string | null;
  requestedByName: string | null;
  po_id: string | null;
  created_at: string;
  items: RequisitionItem[];
  estimatedTotal: number;
}

export async function listRequisitions(supabase: SupabaseClient, orgId: string): Promise<Requisition[]> {
  const { data, error } = await supabase
    .from("purchase_requisitions")
    .select(
      "id, requisition_number, status, needed_by, justification, requested_by, po_id, created_at, purchase_requisition_items(id, product_id, description, quantity, estimated_cost)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    requisition_number: string;
    status: RequisitionStatus;
    needed_by: string | null;
    justification: string | null;
    requested_by: string | null;
    po_id: string | null;
    created_at: string;
    purchase_requisition_items: RequisitionItem[];
  }>;

  const ids = [...new Set(rows.map((r) => r.requested_by).filter((x): x is string => !!x))];
  const nameById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    for (const p of (profiles ?? []) as Array<{ id: string; full_name: string | null }>) {
      if (p.full_name) nameById.set(p.id, p.full_name);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    requisition_number: r.requisition_number,
    status: r.status,
    needed_by: r.needed_by,
    justification: r.justification,
    requestedByName: r.requested_by ? (nameById.get(r.requested_by) ?? null) : null,
    po_id: r.po_id,
    created_at: r.created_at,
    items: r.purchase_requisition_items ?? [],
    estimatedTotal: (r.purchase_requisition_items ?? []).reduce((s, i) => s + i.quantity * i.estimated_cost, 0),
  }));
}

export async function getRequisition(supabase: SupabaseClient, orgId: string, requisitionId: string): Promise<Requisition | null> {
  const { data, error } = await supabase
    .from("purchase_requisitions")
    .select(
      "id, requisition_number, status, needed_by, justification, requested_by, po_id, created_at, purchase_requisition_items(id, product_id, description, quantity, estimated_cost)"
    )
    .eq("org_id", orgId)
    .eq("id", requisitionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const r = data as unknown as {
    id: string;
    requisition_number: string;
    status: RequisitionStatus;
    needed_by: string | null;
    justification: string | null;
    requested_by: string | null;
    po_id: string | null;
    created_at: string;
    purchase_requisition_items: RequisitionItem[];
  };

  return {
    id: r.id,
    requisition_number: r.requisition_number,
    status: r.status,
    needed_by: r.needed_by,
    justification: r.justification,
    requestedByName: null,
    po_id: r.po_id,
    created_at: r.created_at,
    items: r.purchase_requisition_items ?? [],
    estimatedTotal: (r.purchase_requisition_items ?? []).reduce((s, i) => s + i.quantity * i.estimated_cost, 0),
  };
}

export async function createRequisition(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    branchId: string | null;
    items: Array<{ product_id: string; description: string; quantity: number; estimated_cost: number }>;
    neededBy?: string | null;
    justification?: string;
  }
) {
  const { data, error } = await supabase.rpc("create_purchase_requisition", {
    p_org_id: input.orgId,
    // Generated types mark p_branch_id required, but the function accepts
    // NULL (branch is optional) — cast keeps the runtime null intact.
    p_branch_id: input.branchId as string,
    p_items: input.items as unknown as Json,
    p_needed_by: input.neededBy ?? undefined,
    p_justification: input.justification || undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function decideRequisition(
  supabase: SupabaseClient,
  orgId: string,
  requisitionId: string,
  decision: "approved" | "rejected"
) {
  const { error } = await supabase.rpc("decide_purchase_requisition", {
    p_org_id: orgId,
    p_requisition_id: requisitionId,
    p_decision: decision,
  });
  if (error) throw error;
}

/** Link an approved requisition to the PO created from it. */
export async function markRequisitionConverted(supabase: SupabaseClient, requisitionId: string, poId: string) {
  const { error } = await supabase
    .from("purchase_requisitions")
    .update({ status: "converted", po_id: poId })
    .eq("id", requisitionId)
    .eq("status", "approved");
  if (error) throw error;
}
