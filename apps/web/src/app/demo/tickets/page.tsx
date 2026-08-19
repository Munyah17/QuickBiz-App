"use client";

import { useState } from "react";
import { Plus, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoTicket } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const priorityTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

const STATUSES: DemoTicket["status"][] = ["open", "in_progress", "resolved", "closed"];

function NewTicketModal({ onClose }: { onClose: () => void }) {
  const { customers, createTicket } = useDemo();
  const { push } = useToast();
  const [subject, setSubject] = useState("");
  const [customerName, setCustomerName] = useState(customers[0]?.name ?? "");
  const [priority, setPriority] = useState<DemoTicket["priority"]>("medium");

  return (
    <Modal open onClose={onClose} title="New ticket">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim()) return;
          createTicket({ subject: subject.trim(), customerName, priority });
          push("Ticket created");
          onClose();
        }}
      >
        <FormField label="Subject" htmlFor="subject" required>
          <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Customer" htmlFor="customerName">
            <Select id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="priority">
            <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as DemoTicket["priority"])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create ticket</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoTicketsPage() {
  const { tickets, setTicketStatus } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Service Management" title="Service Tickets" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Ticket
        </Button>
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
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{t.ticketNumber}</td>
                  <td className="px-4 py-2.5 text-text-primary">{t.subject}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{t.customerName}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={priorityTone[t.priority] ?? "neutral"}>{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={t.status}
                      onChange={(e) => setTicketStatus(t.id, e.target.value as DemoTicket["status"])}
                      className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewTicketModal onClose={() => setOpen(false)} />}
    </div>
  );
}
