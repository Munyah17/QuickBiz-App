"use client";

import { Mail } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import type { EmailLogRow } from "@/services/email";

const STATUS_TONE: Record<EmailLogRow["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  queued: "neutral",
  sent: "info",
  delivered: "success",
  opened: "success",
  clicked: "success",
  bounced: "warning",
  failed: "danger",
};

export function EmailLogTable({ logs }: { logs: EmailLogRow[] }) {
  return (
    <Card>
      <CardHeader title="Email Log" />
      {logs.length === 0 ? (
        <EmptyState icon={Mail} title="No emails sent yet" description="Emails sent from other parts of the system will be logged here." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">To</th>
              <th className="px-4 py-2.5">Subject</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Sent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">
                  {l.toName ? `${l.toName} <${l.toEmail}>` : l.toEmail}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{l.subject}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {l.sentAt ? new Date(l.sentAt).toLocaleString() : new Date(l.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
