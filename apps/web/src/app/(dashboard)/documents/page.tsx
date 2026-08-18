import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listDocuments } from "@/services/documents";
import { listBranches } from "@/services/branches";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { DeleteDocumentButton } from "./DeleteDocumentButton";

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

export default async function DocumentsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "documents");
  const canManage = permissions.has("documents.manage");

  const [documents, branches] = await Promise.all([listDocuments(supabase, orgId), listBranches(supabase, orgId)]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Documents" />
        {canManage && <UploadDocumentModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />}
      </div>

      <Card>
        {documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
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
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-border-subtle last:border-b-0">
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
    </div>
  );
}
