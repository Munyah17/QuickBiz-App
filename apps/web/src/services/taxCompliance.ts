import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface TaxTypeRow {
  key: string;
  name: string;
  frequency: "monthly" | "quarterly" | "annual" | "ad_hoc";
  dueDay: number | null;
}

export async function listTaxTypes(supabase: SupabaseClient): Promise<TaxTypeRow[]> {
  const { data, error } = await supabase.from("tax_types").select("key, name, frequency, due_day").order("name");
  if (error) throw error;

  return (
    data as unknown as Array<{ key: string; name: string; frequency: TaxTypeRow["frequency"]; due_day: number | null }>
  ).map((row) => ({
    key: row.key,
    name: row.name,
    frequency: row.frequency,
    dueDay: row.due_day,
  }));
}

export interface TaxFilingRow {
  id: string;
  taxTypeKey: string;
  taxTypeName: string;
  year: number;
  period: number;
  dueDate: string;
  amount: number;
  currency: string;
  status: "draft" | "submitted" | "accepted" | "rejected" | "paid";
  filingReference: string | null;
  submittedAt: string | null;
}

export async function listTaxFilings(supabase: SupabaseClient, orgId: string): Promise<TaxFilingRow[]> {
  const { data, error } = await supabase
    .from("tax_filings")
    .select(
      "id, amount, currency, status, filing_reference, submitted_at, tax_periods(year, period, due_date, tax_type_key, tax_types(name))"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      amount: number;
      currency: string;
      status: TaxFilingRow["status"];
      filing_reference: string | null;
      submitted_at: string | null;
      tax_periods: {
        year: number;
        period: number;
        due_date: string;
        tax_type_key: string;
        tax_types: { name: string } | null;
      } | null;
    }>
  ).map((row) => ({
    id: row.id,
    taxTypeKey: row.tax_periods?.tax_type_key ?? "",
    taxTypeName: row.tax_periods?.tax_types?.name ?? row.tax_periods?.tax_type_key ?? "",
    year: row.tax_periods?.year ?? 0,
    period: row.tax_periods?.period ?? 0,
    dueDate: row.tax_periods?.due_date ?? "",
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    filingReference: row.filing_reference,
    submittedAt: row.submitted_at,
  }));
}

export interface CreateTaxFilingInput {
  taxTypeKey: string;
  year: number;
  period: number;
  amount: number;
  currency: string;
}

export async function createTaxFiling(supabase: SupabaseClient, orgId: string, input: CreateTaxFilingInput): Promise<string> {
  const { data: periodId, error: periodError } = await supabase.rpc("create_tax_period", {
    p_org_id: orgId,
    p_tax_type_key: input.taxTypeKey,
    p_year: input.year,
    p_period: input.period,
  });
  if (periodError) throw periodError;

  const { data: filingId, error: filingError } = await supabase.rpc("create_tax_filing", {
    p_tax_period_id: periodId as unknown as string,
    p_amount: input.amount,
    p_currency: input.currency,
  });
  if (filingError) throw filingError;

  return filingId as unknown as string;
}

export async function submitTaxFiling(supabase: SupabaseClient, filingId: string, amount: number, filingReference?: string) {
  const { error } = await supabase.rpc("submit_tax_filing", {
    p_tax_filing_id: filingId,
    p_amount: amount,
    p_filing_reference: filingReference || null,
  });
  if (error) throw error;
}
