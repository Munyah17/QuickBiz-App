import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export type PaymentRequestStatus = "pending" | "approved" | "rejected" | "paid" | "cancelled";

export interface PaymentRequest {
  id: string;
  request_number: string;
  payee: string;
  amount: number;
  currency: string;
  reason: string;
  category: string | null;
  needed_by: string | null;
  status: PaymentRequestStatus;
  requestedByName: string | null;
  decidedByName: string | null;
  decided_at: string | null;
  decision_note: string | null;
  paid_at: string | null;
  po_id: string | null;
  created_at: string;
}

export async function listPaymentRequests(supabase: SupabaseClient, orgId: string): Promise<PaymentRequest[]> {
  const { data, error } = await supabase
    .from("payment_requests")
    .select(
      "id, request_number, payee, amount, currency, reason, category, needed_by, status, decided_at, decision_note, paid_at, po_id, created_at, requested_by, decided_by"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<
    Omit<PaymentRequest, "requestedByName" | "decidedByName"> & {
      requested_by: string | null;
      decided_by: string | null;
    }
  >;

  // Resolve profile names in one query.
  const ids = [...new Set(rows.flatMap((r) => [r.requested_by, r.decided_by]).filter((x): x is string => !!x))];
  const nameById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    for (const p of (profiles ?? []) as Array<{ id: string; full_name: string | null }>) {
      if (p.full_name) nameById.set(p.id, p.full_name);
    }
  }

  return rows.map((r) => ({
    ...r,
    requestedByName: r.requested_by ? (nameById.get(r.requested_by) ?? null) : null,
    decidedByName: r.decided_by ? (nameById.get(r.decided_by) ?? null) : null,
  }));
}

export async function createPaymentRequest(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    branchId: string | null;
    payee: string;
    amount: number;
    reason: string;
    category?: string;
    neededBy?: string | null;
    poId?: string | null;
  }
) {
  const { data, error } = await supabase.rpc("create_payment_request", {
    p_org_id: input.orgId,
    // Generated types mark p_branch_id required, but the function accepts
    // NULL (branch is optional) — cast keeps the runtime null intact.
    p_branch_id: input.branchId as string,
    p_payee: input.payee,
    p_amount: input.amount,
    p_reason: input.reason,
    p_category: input.category || undefined,
    p_needed_by: input.neededBy ?? undefined,
    p_po_id: input.poId ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function decidePaymentRequest(
  supabase: SupabaseClient,
  orgId: string,
  requestId: string,
  decision: "approved" | "rejected",
  note?: string
) {
  const { error } = await supabase.rpc("decide_payment_request", {
    p_org_id: orgId,
    p_request_id: requestId,
    p_decision: decision,
    p_note: note || undefined,
  });
  if (error) throw error;
}

/** Mark an approved request as paid (finance.manage via RLS update policy). */
export async function markPaymentRequestPaid(supabase: SupabaseClient, requestId: string) {
  const { error } = await supabase
    .from("payment_requests")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "approved");
  if (error) throw error;
}
