import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
  notes: string | null;
}

export async function listLeads(supabase: SupabaseClient, orgId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, company, email, phone, source, status, notes")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Lead[];
}

export interface LeadInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes: string;
}

export async function createLead(supabase: SupabaseClient, orgId: string, input: LeadInput) {
  const { error } = await supabase.from("leads").insert({
    org_id: orgId,
    name: input.name,
    company: input.company || null,
    email: input.email || null,
    phone: input.phone || null,
    source: input.source || null,
    status: input.status,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateLead(supabase: SupabaseClient, leadId: string, input: LeadInput) {
  const { error } = await supabase
    .from("leads")
    .update({
      name: input.name,
      company: input.company || null,
      email: input.email || null,
      phone: input.phone || null,
      source: input.source || null,
      status: input.status,
      notes: input.notes || null,
    })
    .eq("id", leadId);
  if (error) throw error;
}

export async function convertLead(supabase: SupabaseClient, orgId: string, leadId: string): Promise<string> {
  const { data, error } = await supabase.rpc("convert_lead_to_customer", { p_org_id: orgId, p_lead_id: leadId });
  if (error) throw error;
  return data as string;
}

export interface Opportunity {
  id: string;
  name: string;
  stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
  value: number;
  expected_close_date: string | null;
  customerName: string | null;
}

export async function listOpportunities(supabase: SupabaseClient, orgId: string): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, name, stage, value, expected_close_date, customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as unknown as Array<Omit<Opportunity, "customerName"> & { customers: { name: string } | null }>).map((row) => ({
    ...row,
    customerName: row.customers?.name ?? null,
  }));
}

export interface OpportunityInput {
  customerId: string;
  name: string;
  stage: string;
  value: number;
  expectedCloseDate: string;
  notes: string;
}

export async function createOpportunity(supabase: SupabaseClient, orgId: string, input: OpportunityInput) {
  const { error } = await supabase.from("opportunities").insert({
    org_id: orgId,
    customer_id: input.customerId || null,
    name: input.name,
    stage: input.stage,
    value: input.value,
    expected_close_date: input.expectedCloseDate || null,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateOpportunityStage(supabase: SupabaseClient, opportunityId: string, stage: string) {
  const { error } = await supabase.from("opportunities").update({ stage }).eq("id", opportunityId);
  if (error) throw error;
}
