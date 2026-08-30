"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { bulkSetProjectStatusAction } from "./actions";
import type { ProjectListRow } from "@/services/projects";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  planning: "neutral",
  active: "info",
  on_hold: "warning",
  completed: "success",
  cancelled: "danger",
};

export function ProjectsTable({ projects, canManage }: { projects: ProjectListRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return [p.name, p.customerName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [projects, query, statusFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetProjectStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} project${ids.length === 1 ? "" : "s"} updated`);
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
          {filtered.length} of {projects.length} projects
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, customer..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ExportButton
            filename="projects"
            rows={filtered.map((p) => ({
              Name: p.name,
              Customer: p.customerName ?? "Internal",
              Budget: p.budget,
              Status: p.status,
              "Start date": p.start_date ?? "",
              "End date": p.end_date ?? "",
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("active")}>
            Mark Active
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("on_hold")}>
            Mark On Hold
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("completed")}>
            Mark Completed
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects match your search" />
      ) : (
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
              <th className="px-4 py-2.5">Budget</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Dates</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <Link href={`/projects/${p.id}`} className="font-medium text-primary-600 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{p.customerName ?? "Internal"}</td>
                <td className="px-4 py-2.5 text-text-secondary">${p.budget.toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[p.status] ?? "neutral"}>{p.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {p.start_date ? new Date(p.start_date).toLocaleDateString() : "No start date"}
                  {p.end_date ? ` to ${new Date(p.end_date).toLocaleDateString()}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
