"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Pencil, UserPlus } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { LeadFormModal } from "./LeadFormModal";
import { ConvertLeadButton } from "./ConvertLeadButton";
import { bulkSetLeadStatusAction } from "./actions";
import type { Lead } from "@/services/crm";

const statusTone: Record<Lead["status"], "info" | "warning" | "success" | "danger" | "neutral"> = {
  new: "info",
  contacted: "warning",
  qualified: "success",
  unqualified: "danger",
  converted: "neutral",
};

export function LeadsTable({ leads, canManage }: { leads: Lead[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.company, l.email, l.phone, l.source].some((field) => field?.toLowerCase().includes(q));
    });
  }, [leads, query, statusFilter]);

  const selectableIds = useMemo(() => filtered.filter((l) => l.status !== "converted").map((l) => l.id), [filtered]);
  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelectableSelected ? new Set() : new Set(selectableIds));
  }

  function runBulk(status: Lead["status"]) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetLeadStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} lead${ids.length === 1 ? "" : "s"} marked ${status}`);
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
          {filtered.length} of {leads.length} leads
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, company, contact..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
            <option value="converted">Converted</option>
          </Select>
          <ExportButton
            filename="leads"
            rows={filtered.map((l) => ({
              Name: l.name,
              Company: l.company ?? "",
              Email: l.email ?? "",
              Phone: l.phone ?? "",
              Source: l.source ?? "",
              Status: l.status,
              Notes: l.notes ?? "",
            }))}
          />
          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(undefined);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              New Lead
            </Button>
          )}
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("contacted")}>
            Mark Contacted
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("qualified")}>
            Mark Qualified
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("unqualified")}>
            Mark Unqualified
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {leads.length === 0 ? (
        <EmptyState icon={UserPlus} title="No leads yet" description="Add a lead to start building your pipeline." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserPlus} title="No leads match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allSelectableSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    {lead.status !== "converted" && (
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleOne(lead.id)}
                        className="size-4 rounded border-border"
                      />
                    )}
                  </td>
                )}
                <td className="px-4 py-2.5 font-medium text-text-primary">{lead.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{lead.company || "No company"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{lead.email || lead.phone || "No contact info"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{lead.source || "Unknown"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[lead.status]}>{lead.status}</Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      {lead.status !== "converted" && <ConvertLeadButton leadId={lead.id} />}
                      <button
                        onClick={() => {
                          setEditing(lead);
                          setModalOpen(true);
                        }}
                        title="Edit lead"
                        className="text-text-tertiary hover:text-primary-600"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canManage && modalOpen && <LeadFormModal key={editing?.id ?? "new"} open={modalOpen} onClose={() => setModalOpen(false)} lead={editing} />}
    </Card>
  );
}
