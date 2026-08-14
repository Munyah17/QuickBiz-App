import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requirePermission } from "@/lib/session";
import { listAuditLogs } from "@/services/audit";

const actionTone: Record<string, "success" | "info" | "danger"> = {
  insert: "success",
  update: "info",
  delete: "danger",
};

export default async function AuditLogsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  requirePermission(permissions, "audit.view");
  const logs = await listAuditLogs(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Company" title="Audit Log" />

      <Card>
        {logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity yet" description="Actions across the platform will show up here." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Date & Time</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-text-primary">{log.actorName ?? "System"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={actionTone[log.action] ?? "info"}>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{log.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
