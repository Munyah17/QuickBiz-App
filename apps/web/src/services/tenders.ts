import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface TenderRow {
  id: string;
  tenderNumber: string;
  title: string;
  status: "draft" | "published" | "closed" | "awarded" | "cancelled";
  closingDate: string;
  budget: number | null;
}

export async function listTenders(supabase: SupabaseClient, orgId: string): Promise<TenderRow[]> {
  const { data, error } = await supabase.rpc("list_tenders", { p_org_id: orgId });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      tender_number: string;
      title: string;
      status: TenderRow["status"];
      closing_date: string;
      budget: number | null;
    }>
  ).map((row) => ({
    id: row.id,
    tenderNumber: row.tender_number,
    title: row.title,
    status: row.status,
    closingDate: row.closing_date,
    budget: row.budget,
  }));
}

export interface CreateTenderInput {
  tenderNumber: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  closingDate: string;
}

export async function createTender(supabase: SupabaseClient, orgId: string, input: CreateTenderInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_tender", {
    p_org_id: orgId,
    p_tender_number: input.tenderNumber,
    p_title: input.title,
    p_description: input.description || null,
    p_category: input.category || null,
    p_budget: input.budget || null,
    p_closing_date: input.closingDate,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface TenderBidRow {
  id: string;
  tenderId: string;
  supplierId: string | null;
  supplierName: string;
  bidNumber: string;
  amount: number;
  currency: string;
  status: "submitted" | "under_review" | "shortlisted" | "rejected" | "awarded" | "withdrawn";
  submittedAt: string;
}

export async function listTenderBids(supabase: SupabaseClient, tenderId: string): Promise<TenderBidRow[]> {
  const { data, error } = await supabase
    .from("tender_bids")
    .select("id, tender_id, supplier_id, bid_number, amount, currency, status, submitted_at, suppliers(name)")
    .eq("tender_id", tenderId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      tender_id: string;
      supplier_id: string | null;
      bid_number: string;
      amount: number;
      currency: string;
      status: TenderBidRow["status"];
      submitted_at: string;
      suppliers: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    tenderId: row.tender_id,
    supplierId: row.supplier_id,
    supplierName: row.suppliers?.name ?? "Unknown supplier",
    bidNumber: row.bid_number,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    submittedAt: row.submitted_at,
  }));
}

export async function submitTenderBid(
  supabase: SupabaseClient,
  tenderId: string,
  supplierId: string,
  amount: number
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_tender_bid", {
    p_tender_id: tenderId,
    p_supplier_id: supplierId,
    p_amount: amount,
  });
  if (error) throw error;

  return data as unknown as string;
}

export async function awardTender(supabase: SupabaseClient, tenderId: string, bidId: string, awardAmount: number) {
  const { error } = await supabase.rpc("award_tender", {
    p_tender_id: tenderId,
    p_bid_id: bidId,
    p_award_amount: awardAmount,
  });
  if (error) throw error;
}
