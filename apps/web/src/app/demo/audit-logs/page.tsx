"use client";

import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { useDemo } from "@/lib/demo/DemoContext";

export default function DemoAuditLogsPage() {
  const { auditLog } = useDemo();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit Logs" />

      <Card>
        {auditLog.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity yet" />
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle px-4">
            {auditLog.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-primary">{entry.action}</span>
                <span className="text-xs text-text-tertiary">
                  {entry.actor} - {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
