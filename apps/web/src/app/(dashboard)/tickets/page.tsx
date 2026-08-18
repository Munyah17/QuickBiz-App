import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listTickets } from "@/services/tickets";
import { listCustomers } from "@/services/customers";
import { NewTicketModal } from "./NewTicketModal";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "neutral",
};

const priorityTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export default async function TicketsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "service_management");
  const canManage = permissions.has("service.manage");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();
  const [tickets, customers] = await Promise.all([listTickets(supabase, orgId), listCustomers(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Service Tickets" />
        {canManage && (
          <NewTicketModal customers={customers.filter((c) => c.is_active)} branchId={(member?.branch_id as string) ?? ""} />
        )}
      </div>

      <Card>
        {tickets.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No tickets yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Ticket #</th>
                <th className="px-4 py-2.5">Subject</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/tickets/${t.id}`} className="font-mono font-medium text-primary-600 hover:underline">
                      {t.ticket_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-primary">{t.subject}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{t.customerName ?? "Internal"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={priorityTone[t.priority] ?? "neutral"}>{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[t.status] ?? "neutral"}>{t.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
