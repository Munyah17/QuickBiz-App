"use client";

import { useActionState, useState } from "react";
import { LifeBuoy, Plus } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createSupportTicket, initialDevActionState } from "../../actions";
import type { SupportTicketRow } from "@/services/developers";

const STATUS_STYLE: Record<SupportTicketRow["status"], string> = {
  open: "bg-warning-50 text-warning-600",
  answered: "bg-success-50 text-success-600",
  closed: "bg-workspace text-text-tertiary",
};

export function SupportManager({ tickets }: { tickets: SupportTicketRow[] }) {
  const [state, formAction, isPending] = useActionState(createSupportTicket, initialDevActionState);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />
          New ticket
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form action={formAction} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Subject</label>
              <Input name="subject" required placeholder="e.g. Webhook deliveries failing" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Message</label>
              <textarea
                name="body"
                required
                rows={4}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none"
                placeholder="Describe the issue — include endpoint, key prefix, and timestamps if relevant."
              />
            </div>
            {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
            {state.success && <p className="text-sm text-success-600">{state.success}</p>}
            <Button type="submit" loading={isPending} className="self-start">
              Submit ticket
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Your tickets</h3>
        {tickets.length === 0 ? (
          <p className="text-sm text-text-tertiary">No tickets yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-md border border-border-subtle px-3 py-2">
                <LifeBuoy className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{t.subject}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">{t.body}</p>
                  <p className="mt-1 text-xs text-text-tertiary">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
