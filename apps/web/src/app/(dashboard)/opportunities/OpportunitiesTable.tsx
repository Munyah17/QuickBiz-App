"use client";

import { useMemo, useState, useTransition } from "react";
import { Target } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { StageSelect } from "./StageSelect";
import { bulkSetOpportunityStageAction } from "./actions";
import type { Opportunity } from "@/services/crm";

export function OpportunitiesTable({ opportunities, canManage }: { opportunities: Opportunity[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (stageFilter !== "all" && o.stage !== stageFilter) return false;
      if (!q) return true;
      return [o.name, o.customerName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [opportunities, query, stageFilter]);

  const openValue = filtered.filter((o) => o.stage !== "won" && o.stage !== "lost").reduce((sum, o) => sum + o.value, 0);
  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((o) => o.id)));
  }

  function runBulk(stage: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetOpportunityStageAction(ids, stage);
      if (result.success) {
        push(`${ids.length} opportunit${ids.length === 1 ? "y" : "ies"} moved to ${stage}`);
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
          {filtered.length} of {opportunities.length} opportunities
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, customer..." />
          <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="w-36">
            <option value="all">All stages</option>
            <option value="prospecting">Prospecting</option>
            <option value="qualification">Qualification</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>
          <ExportButton
            filename="opportunities"
            rows={filtered.map((o) => ({
              Name: o.name,
              Customer: o.customerName ?? "",
              Value: o.value,
              "Expected close": o.expected_close_date ?? "",
              Stage: o.stage,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("negotiation")}>
            Move to Negotiation
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("won")}>
            Mark Won
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("lost")}>
            Mark Lost
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {opportunities.length === 0 ? (
        <EmptyState icon={Target} title="No opportunities yet" description="Track deals as they move through your pipeline." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Target} title="No opportunities match your search" />
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {canManage && (
                  <th className="w-10 px-4 py-2.5">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                  </th>
                )}
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Expected close</th>
                <th className="px-4 py-2.5">Stage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                  {canManage && (
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleOne(o.id)}
                        className="size-4 rounded border-border"
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-medium text-text-primary">{o.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{o.customerName ?? "No customer"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${o.value.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {o.expected_close_date ? new Date(o.expected_close_date).toLocaleDateString() : "Not set"}
                  </td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <StageSelect opportunityId={o.id} stage={o.stage} />
                    ) : (
                      <span className="capitalize text-text-secondary">{o.stage}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
            Open pipeline value: ${openValue.toFixed(2)}
          </div>
        </>
      )}
    </Card>
  );
}
