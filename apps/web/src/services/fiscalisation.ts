import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

// ---- Virtual fiscal devices ------------------------------------------------

export interface FiscalDeviceRow {
  id: string;
  device_serial: string;
  device_model: string | null;
  zimra_device_id: string | null;
  certificate_thumbprint: string | null;
  status: "active" | "inactive" | "suspended";
  fiscal_day_number: number;
  last_sync_at: string | null;
  created_at: string;
  branchName: string | null;
}

export async function listFiscalDevices(supabase: SupabaseClient, orgId: string): Promise<FiscalDeviceRow[]> {
  const { data, error } = await supabase
    .from("fiscal_devices")
    .select("id, device_serial, device_model, zimra_device_id, certificate_thumbprint, status, fiscal_day_number, last_sync_at, created_at, branches(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<Omit<FiscalDeviceRow, "branchName"> & { branches: { name: string } | null }>
  ).map((r) => ({ ...r, branchName: r.branches?.name ?? null }));
}

export interface FiscalDeviceInput {
  branchId: string;
  deviceSerial: string;
  deviceModel: string;
  zimraDeviceId: string;
  certificateThumbprint: string;
}

export async function registerFiscalDevice(supabase: SupabaseClient, orgId: string, input: FiscalDeviceInput) {
  const { error } = await supabase.from("fiscal_devices").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    device_serial: input.deviceSerial,
    device_model: input.deviceModel || null,
    zimra_device_id: input.zimraDeviceId || null,
    certificate_thumbprint: input.certificateThumbprint || null,
    status: "active",
    last_sync_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function setFiscalDeviceStatus(supabase: SupabaseClient, deviceId: string, status: string) {
  const { error } = await supabase.from("fiscal_devices").update({ status }).eq("id", deviceId);
  if (error) throw error;
}

// ---- Fiscalised receipts ----------------------------------------------------

export interface FiscalReceiptRow {
  id: string;
  receipt_number: string;
  fiscal_day_number: number | null;
  receipt_total: number;
  vat_amount: number;
  verification_code: string | null;
  status: "fiscalised" | "pending" | "failed";
  fiscalised_at: string;
  deviceSerial: string | null;
  invoiceNumber: string | null;
}

export async function listFiscalReceipts(supabase: SupabaseClient, orgId: string): Promise<FiscalReceiptRow[]> {
  const { data, error } = await supabase
    .from("fiscal_receipts")
    .select("id, receipt_number, fiscal_day_number, receipt_total, vat_amount, verification_code, status, fiscalised_at, fiscal_devices(device_serial), sales_invoices(invoice_number)")
    .eq("org_id", orgId)
    .order("fiscalised_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<
      Omit<FiscalReceiptRow, "deviceSerial" | "invoiceNumber"> & {
        fiscal_devices: { device_serial: string } | null;
        sales_invoices: { invoice_number: string } | null;
      }
    >
  ).map((r) => ({
    ...r,
    deviceSerial: r.fiscal_devices?.device_serial ?? null,
    invoiceNumber: r.sales_invoices?.invoice_number ?? null,
  }));
}

export interface FiscalReceiptInput {
  deviceId: string;
  salesInvoiceId: string;
  receiptTotal: number;
  vatAmount: number;
}

/**
 * Fiscalises a receipt against a virtual device. In a full FDMS integration
 * this would sign the receipt with the device certificate and return ZIMRA's
 * verification code + QR payload; here we generate the local receipt number,
 * stamp the device's current fiscal day, and produce a verification code so
 * the record is complete and printable.
 */
export async function fiscaliseReceipt(supabase: SupabaseClient, orgId: string, input: FiscalReceiptInput) {
  const { data: receiptNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "fiscal_receipt",
  });
  if (numError) throw numError;

  // Current fiscal day on the device, so the receipt is stamped correctly.
  let fiscalDay: number | null = null;
  if (input.deviceId) {
    const { data: device } = await supabase
      .from("fiscal_devices")
      .select("fiscal_day_number")
      .eq("id", input.deviceId)
      .maybeSingle();
    fiscalDay = (device?.fiscal_day_number as number) ?? null;
  }

  const verificationCode = Math.random().toString(36).slice(2, 10).toUpperCase();
  const { error } = await supabase.from("fiscal_receipts").insert({
    org_id: orgId,
    device_id: input.deviceId || null,
    sales_invoice_id: input.salesInvoiceId || null,
    receipt_number: receiptNumber,
    fiscal_day_number: fiscalDay,
    receipt_total: input.receiptTotal,
    vat_amount: input.vatAmount,
    verification_code: verificationCode,
    qr_data: `${receiptNumber}|${verificationCode}|${input.receiptTotal.toFixed(2)}`,
    status: "fiscalised",
    fiscalised_at: new Date().toISOString(),
  });
  if (error) throw error;

  if (input.deviceId) {
    await supabase
      .from("fiscal_devices")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", input.deviceId);
  }
}

// ---- VAT returns ------------------------------------------------------------

export interface VatReturnRow {
  id: string;
  period_start: string;
  period_end: string;
  output_vat: number;
  input_vat: number;
  net_vat: number;
  status: "draft" | "submitted" | "processed";
  reference: string | null;
  submitted_at: string | null;
  processed_at: string | null;
  created_at: string;
}

export async function listVatReturns(supabase: SupabaseClient, orgId: string): Promise<VatReturnRow[]> {
  const { data, error } = await supabase
    .from("vat_returns")
    .select("id, period_start, period_end, output_vat, input_vat, net_vat, status, reference, submitted_at, processed_at, created_at")
    .eq("org_id", orgId)
    .order("period_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as VatReturnRow[];
}

export interface VatReturnInput {
  periodStart: string;
  periodEnd: string;
  outputVat: number;
  inputVat: number;
  reference: string;
}

export async function createVatReturn(supabase: SupabaseClient, orgId: string, input: VatReturnInput) {
  const { error } = await supabase.from("vat_returns").insert({
    org_id: orgId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    output_vat: input.outputVat,
    input_vat: input.inputVat,
    reference: input.reference || null,
    status: "draft",
  });
  if (error) throw error;
}

export async function setVatReturnStatus(supabase: SupabaseClient, returnId: string, status: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("vat_returns")
    .update({
      status,
      submitted_at: status === "submitted" ? now : undefined,
      processed_at: status === "processed" ? now : undefined,
    })
    .eq("id", returnId);
  if (error) throw error;
}
