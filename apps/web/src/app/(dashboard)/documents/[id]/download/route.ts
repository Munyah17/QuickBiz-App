import { NextResponse } from "next/server";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getDocumentForDownload } from "@/services/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "documents");

  const result = await getDocumentForDownload(supabase, orgId, id);
  if (!result) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.redirect(result.signedUrl);
}
