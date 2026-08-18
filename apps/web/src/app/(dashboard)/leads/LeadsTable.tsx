"use client";

import { useState } from "react";
import { Plus, Pencil, UserPlus } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LeadFormModal } from "./LeadFormModal";
import { ConvertLeadButton } from "./ConvertLeadButton";
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

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{leads.length} leads</h3>
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

      {leads.length === 0 ? (
        <EmptyState icon={UserPlus} title="No leads yet" description="Add a lead to start building your pipeline." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border-subtle last:border-b-0">
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
