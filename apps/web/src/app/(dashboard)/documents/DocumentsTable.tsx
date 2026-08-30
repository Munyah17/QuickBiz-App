"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { DeleteDocumentButton } from "./DeleteDocumentButton";
import { bulkDeleteDocumentsAction } from "./actions";
import type { DocumentRow } from "@/services/documents";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  contract: "info",
  invoice: "success",
  license: "warning",
  policy: "neutral",
  compliance: "danger",
  general: "neutral",
};

export function DocumentsTable({ documents, canManage }: { documents: DocumentRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
      if (!q) return true;
      return [d.title, d.file_name, d.branchName, d.uploadedByName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [documents, query, categoryFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((d) => d.id)));
  }

  function runBulkDelete() {
    const ids = Array.from(selected);
    if (!window.confirm(`Delete ${ids.length} document${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    startBulkTransition(async () => {
      const result = await bulkDeleteDocumentsAction(ids);
      if (result.success) {
        push(`${ids.length} document${ids.length === 1 ? "" : "s"} deleted`);
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
          {filtered.length} of {documents.length} documents
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, file name, branch..." />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-36">
            <option value="all">All categories</option>
            <option value="contract">Contract</option>
            <option value="invoice">Invoice</option>
            <option value="license">License</option>
            <option value="policy">Policy</option>
            <option value="compliance">Compliance</option>
            <option value="general">General</option>
          </Select>
          <ExportButton
            filename="documents"
            rows={filtered.map((d) => ({
              Title: d.title,
              "File name": d.file_name,
              Category: d.category,
              Branch: d.branchName ?? "",
              "Size (bytes)": d.file_size,
              Expiry: d.expiry_date ?? "",
              "Uploaded by": d.uploadedByName ?? "",
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="danger" loading={isBulkPending} onClick={runBulkDelete}>
            Delete
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No documents match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Branch</th>
              <th className="px-4 py-2.5">Size</th>
              <th className="px-4 py-2.5">Expiry</th>
              <th className="px-4 py-2.5">Uploaded by</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggleOne(d.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <p className="font-medium text-text-primary">{d.title}</p>
                  <p className="text-xs text-text-tertiary">{d.file_name}</p>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={categoryTone[d.category] ?? "neutral"}>{d.category}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{d.branchName ?? "All branches"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{formatFileSize(d.file_size)}</td>
                <td className="px-4 py-2.5">
                  {d.expiry_date ? (
                    <Badge tone={d.expiry_date < today ? "danger" : "neutral"}>
                      {new Date(d.expiry_date).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <span className="text-text-tertiary">No expiry</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{d.uploadedByName ?? "Unknown"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/documents/${d.id}/download`}
                      className="rounded-md p-1.5 text-text-tertiary hover:bg-workspace hover:text-primary-600"
                      aria-label={`Download ${d.title}`}
                    >
                      <Download className="size-4" />
                    </Link>
                    {canManage && <DeleteDocumentButton documentId={d.id} title={d.title} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
