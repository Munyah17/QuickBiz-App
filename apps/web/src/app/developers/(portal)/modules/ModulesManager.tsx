"use client";

import { useActionState, useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { submitModule, withdrawSubmission, initialDevActionState } from "../../actions";
import type { ModuleSubmissionRow } from "@/services/developers";

const STATUS_STYLE: Record<ModuleSubmissionRow["status"], string> = {
  draft: "bg-workspace text-text-tertiary",
  pending_review: "bg-warning-50 text-warning-600",
  approved: "bg-success-50 text-success-600",
  rejected: "bg-danger-50 text-danger-600",
  suspended: "bg-danger-50 text-danger-600",
  deleted: "bg-workspace text-text-tertiary",
};

const STATUS_LABEL: Record<ModuleSubmissionRow["status"], string> = {
  draft: "Draft",
  pending_review: "In review",
  approved: "Live",
  rejected: "Rejected",
  suspended: "Suspended",
  deleted: "Removed",
};

export function ModulesManager({ submissions }: { submissions: ModuleSubmissionRow[] }) {
  const [state, formAction, isPending] = useActionState(submitModule, initialDevActionState);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />
          Submit a module
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form action={formAction} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Module name</label>
                <Input name="name" required placeholder="e.g. Zimra Fiscal Bridge" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Module key</label>
                <Input name="moduleKey" required placeholder="e.g. zimra_fiscal" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Description</label>
              <Input name="description" required placeholder="What it does — shown in the Module Store" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Category</label>
                <Select name="category" defaultValue="other">
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="people">People</option>
                  <option value="platform">Platform</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Version</label>
                <Input name="version" defaultValue="1.0.0" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Price ($/mo, 0 = free)</label>
                <Input name="monthlyPriceUsd" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Entry URL <span className="text-text-tertiary">(where your module is hosted)</span>
              </label>
              <Input name="entryUrl" type="url" placeholder="https://yourapp.com/module" />
            </div>
            {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
            {state.success && <p className="text-sm text-success-600">{state.success}</p>}
            <Button type="submit" loading={isPending} className="self-start">
              Submit for review
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Submissions</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-text-tertiary">No modules submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-md border border-border-subtle px-3 py-2">
                <Package className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{s.name}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {s.moduleKey} · v{s.version} · ${s.monthlyPriceUsd.toFixed(2)}/mo
                    {s.activeLicenses ? ` · ${s.activeLicenses} license${s.activeLicenses === 1 ? "" : "s"}` : ""}
                  </p>
                  {s.reviewNotes && <p className="mt-1 text-xs text-warning-600">Review: {s.reviewNotes}</p>}
                </div>
                {["draft", "pending_review", "rejected"].includes(s.status) && (
                  <button
                    type="button"
                    onClick={() => void withdrawSubmission(s.id)}
                    className="text-text-tertiary hover:text-danger-600"
                    title="Withdraw"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
