import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface IbanRequestRow {
  id: string;
  iban: string | null;
  bankName: string | null;
  currency: string;
  status: "pending" | "active" | "suspended" | "closed";
  balance: number;
  availableBalance: number;
  createdAt: string;
}

export async function listIbanRequests(supabase: SupabaseClient, orgId: string): Promise<IbanRequestRow[]> {
  const { data, error } = await supabase.rpc("list_iban_accounts", { p_org_id: orgId });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      iban: string | null;
      bank_name: string | null;
      currency: string;
      status: "pending" | "active" | "suspended" | "closed";
      balance: number;
      available_balance: number;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    iban: row.iban,
    bankName: row.bank_name,
    currency: row.currency,
    status: row.status,
    balance: row.balance,
    availableBalance: row.available_balance,
    createdAt: row.created_at,
  }));
}

export interface IbanRequestInput {
  currency: string;
  notes: string;
}

export async function requestIban(supabase: SupabaseClient, orgId: string, input: IbanRequestInput) {
  const { error } = await supabase.rpc("request_iban", {
    p_org_id: orgId,
    p_currency: input.currency,
    p_notes: input.notes || null,
  });
  if (error) throw error;
}
