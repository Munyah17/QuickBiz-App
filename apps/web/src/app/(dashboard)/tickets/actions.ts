"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createTicket, updateTicketStatus, addTicketComment, type TicketInput } from "@/services/tickets";

export interface TicketActionState {
  error: string | null;
  success: boolean;
}

export const initialTicketActionState: TicketActionState = { error: null, success: false };

export async function createTicketAction(_prev: TicketActionState, formData: FormData): Promise<TicketActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "service_management");

  if (!permissions.has("service.manage")) {
    return { error: "You don't have permission to create tickets.", success: false };
  }

  const input: TicketInput = {
    customerId: String(formData.get("customerId") ?? ""),
    branchId: String(formData.get("branchId") ?? ""),
    subject: String(formData.get("subject") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    priority: String(formData.get("priority") ?? "medium"),
  };

  if (!input.subject) return { error: "Subject is required.", success: false };

  let ticketId: string;
  try {
    ticketId = await createTicket(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tickets");
  redirect(`/tickets/${ticketId}`);
}

export async function updateTicketStatusAction(_prev: TicketActionState, formData: FormData): Promise<TicketActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("service.manage")) {
    return { error: "You don't have permission to update this ticket.", success: false };
  }

  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateTicketStatus(supabase, ticketId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { error: null, success: true };
}

export async function bulkSetTicketStatusAction(ticketIds: string[], status: string): Promise<TicketActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("service.manage")) {
    return { error: "You don't have permission to update tickets.", success: false };
  }
  if (ticketIds.length === 0) return { error: "No tickets selected.", success: false };

  try {
    await Promise.all(ticketIds.map((id) => updateTicketStatus(supabase, id, status)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/tickets");
  return { error: null, success: true };
}

export async function addTicketCommentAction(_prev: TicketActionState, formData: FormData): Promise<TicketActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("service.manage")) {
    return { error: "You don't have permission to comment.", success: false };
  }

  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Comment cannot be empty.", success: false };

  try {
    await addTicketComment(supabase, orgId, ticketId, body);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { error: null, success: true };
}
