import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getTicket, listTicketComments } from "@/services/tickets";
import { StatusSelect } from "./StatusSelect";
import { CommentThread } from "./CommentThread";

const priorityTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "service_management");

  const ticket = await getTicket(supabase, orgId, id);
  if (!ticket) notFound();

  const comments = await listTicketComments(supabase, id);
  const canManage = permissions.has("service.manage");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Service"
        title={`${ticket.ticket_number}: ${ticket.subject}`}
        action={canManage ? <StatusSelect ticketId={ticket.id} status={ticket.status} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Activity" />
            <CommentThread ticketId={ticket.id} comments={comments} canManage={canManage} />
          </Card>
        </div>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Priority</span>
            <Badge tone={priorityTone[ticket.priority] ?? "neutral"}>{ticket.priority}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Customer</span>
            <span className="text-sm text-text-primary">{ticket.customerName ?? "Internal"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Created</span>
            <span className="text-sm text-text-primary">{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
          {ticket.description && (
            <div className="border-t border-border-subtle pt-3">
              <p className="text-sm font-medium text-text-secondary">Description</p>
              <p className="text-sm text-text-primary">{ticket.description}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
