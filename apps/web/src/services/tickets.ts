import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface TicketListRow {
  id: string;
  ticket_number: string;
  subject: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  customerName: string | null;
  created_at: string;
}

export async function listTickets(supabase: SupabaseClient, orgId: string): Promise<TicketListRow[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("id, ticket_number, subject, priority, status, created_at, customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as unknown as Array<Omit<TicketListRow, "customerName"> & { customers: { name: string } | null }>).map((row) => ({
    ...row,
    customerName: row.customers?.name ?? null,
  }));
}

export interface TicketInput {
  customerId: string;
  branchId: string;
  subject: string;
  description: string;
  priority: string;
}

export async function createTicket(supabase: SupabaseClient, orgId: string, input: TicketInput): Promise<string> {
  const { data: ticketNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "ticket",
  });
  if (numError) throw numError;

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      org_id: orgId,
      branch_id: input.branchId || null,
      customer_id: input.customerId || null,
      ticket_number: ticketNumber,
      subject: input.subject,
      description: input.description || null,
      priority: input.priority,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface TicketDetail {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  priority: TicketListRow["priority"];
  status: TicketListRow["status"];
  customerName: string | null;
  created_at: string;
}

export async function getTicket(supabase: SupabaseClient, orgId: string, ticketId: string): Promise<TicketDetail | null> {
  const { data, error } = await supabase
    .from("tickets")
    .select("id, ticket_number, subject, description, priority, status, created_at, customers(name)")
    .eq("org_id", orgId)
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Omit<TicketDetail, "customerName"> & { customers: { name: string } | null };
  return { ...row, customerName: row.customers?.name ?? null };
}

export async function updateTicketStatus(supabase: SupabaseClient, ticketId: string, status: string) {
  const { error } = await supabase
    .from("tickets")
    .update({ status, resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null })
    .eq("id", ticketId);
  if (error) throw error;
}

export interface TicketComment {
  id: string;
  body: string;
  created_at: string;
  authorName: string | null;
}

export async function listTicketComments(supabase: SupabaseClient, ticketId: string): Promise<TicketComment[]> {
  const { data, error } = await supabase
    .from("ticket_comments")
    .select("id, body, created_at, profiles(full_name)")
    .eq("ticket_id", ticketId)
    .order("created_at");
  if (error) throw error;

  return (data as unknown as Array<Omit<TicketComment, "authorName"> & { profiles: { full_name: string | null } | null }>).map((row) => ({
    ...row,
    authorName: row.profiles?.full_name ?? null,
  }));
}

export async function addTicketComment(supabase: SupabaseClient, orgId: string, ticketId: string, body: string) {
  const { error } = await supabase.from("ticket_comments").insert({ org_id: orgId, ticket_id: ticketId, body });
  if (error) throw error;
}
