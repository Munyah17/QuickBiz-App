"use client";

import { useState } from "react";
import { Plus, GitBranch } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { BranchFormModal } from "./BranchFormModal";
import type { Branch } from "@/services/branches";

const typeLabels: Record<Branch["type"], string> = {
  head_office: "Head Office",
  branch: "Branch",
  warehouse: "Warehouse",
};

export function BranchesTable({ branches, canManage }: { branches: Branch[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | undefined>(undefined);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{branches.length} branches</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            New Branch
          </Button>
        )}
      </div>

      {branches.length === 0 ? (
        <EmptyState icon={GitBranch} title="No branches yet" description="Add your first branch or location." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{branch.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{branch.code || "No code"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{typeLabels[branch.type]}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {[branch.address?.city, branch.address?.country].filter(Boolean).join(", ") || "No address"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={branch.is_active ? "success" : "neutral"}>{branch.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {canManage && (
                    <button
                      onClick={() => {
                        setEditing(branch);
                        setModalOpen(true);
                      }}
                      className="text-sm font-medium text-primary-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <BranchFormModal open={modalOpen} onClose={() => setModalOpen(false)} branch={editing} />
    </Card>
  );
}
