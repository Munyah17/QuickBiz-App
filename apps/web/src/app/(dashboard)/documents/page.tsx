import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listDocuments } from "@/services/documents";
import { listBranches } from "@/services/branches";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { DocumentsTable } from "./DocumentsTable";

export default async function DocumentsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "documents");
  const canManage = permissions.has("documents.manage");

  const [documents, branches] = await Promise.all([listDocuments(supabase, orgId), listBranches(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Documents" />
        {canManage && <UploadDocumentModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />}
      </div>

      <DocumentsTable documents={documents} canManage={canManage} />
    </div>
  );
}
