import { History } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { AuditLogRow } from "@/services/audit";

const actionVerb: Record<string, string> = {
  insert: "created",
  update: "updated",
  delete: "deleted",
};

function describeEntity(entityType: string): string {
  return entityType.replace(/_/g, " ");
}

export function ActivityFeed({ logs }: { logs: AuditLogRow[] }) {
  if (logs.length === 0) {
    return <EmptyState icon={History} title="No recent activity" description="Actions across your organization will show up here." />;
  }

  return (
    <ul className="flex flex-col">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0">
          <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text-primary">
              <span className="font-medium">{log.actorName ?? "System"}</span>{" "}
              {actionVerb[log.action] ?? log.action} a {describeEntity(log.entity_type)}
            </p>
            <p className="text-xs text-text-tertiary">
              {new Date(log.created_at).toLocaleString()} · <span className="capitalize">{log.module}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
