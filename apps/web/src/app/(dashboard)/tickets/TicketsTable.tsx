"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { bulkSetTicketStatusAction } from "./actions";
import type { TicketListRow } from "@/services/tickets";

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

export function TicketsTable({ tickets, canManage }: { tickets: TicketListRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return [t.subject, t.ticket_number, t.customerName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((t) => t.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetTicketStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} ticket${ids.length === 1 ? "" : "s"} updated`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {tickets.length} tickets
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search subject, ticket #, customer..." />
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-32">
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
          <ExportButton
            filename="tickets"
            rows={filtered.map((t) => ({
              "Ticket #": t.ticket_number,
              Subject: t.subject,
              Customer: t.customerName ?? "Internal",
              Priority: t.priority,
              Status: t.status,
              Created: t.created_at,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("in_progress")}>
            Mark In Progress
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("resolved")}>
            Mark Resolved
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("closed")}>
            Close
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Ticket #</th>
              <th className="px-4 py-2.5">Subject</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Priority</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggleOne(t.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
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
  );
}
