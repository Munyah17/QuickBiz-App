"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { uploadDocument, deleteDocument } from "@/services/documents";

export interface DocumentActionState {
  error: string | null;
  success: boolean;
}

export const initialDocumentActionState: DocumentActionState = { error: null, success: false };

export async function uploadDocumentAction(
  _prev: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "documents");

  if (!permissions.has("documents.manage")) {
    return { error: "You don't have permission to upload documents.", success: false };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload.", success: false };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required.", success: false };

  try {
    await uploadDocument(supabase, orgId, {
      title,
      category: String(formData.get("category") ?? "general"),
      description: String(formData.get("description") ?? "").trim(),
      branchId: String(formData.get("branchId") ?? ""),
      expiryDate: String(formData.get("expiryDate") ?? ""),
      file,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/documents");
  return { error: null, success: true };
}

export async function deleteDocumentAction(
  _prev: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("documents.manage")) {
    return { error: "You don't have permission to delete documents.", success: false };
  }

  const documentId = String(formData.get("documentId") ?? "");

  try {
    await deleteDocument(supabase, orgId, documentId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/documents");
  return { error: null, success: true };
}

export async function bulkDeleteDocumentsAction(documentIds: string[]): Promise<DocumentActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("documents.manage")) {
    return { error: "You don't have permission to delete documents.", success: false };
  }
  if (documentIds.length === 0) return { error: "No documents selected.", success: false };

  try {
    await Promise.all(documentIds.map((id) => deleteDocument(supabase, orgId, id)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/documents");
  return { error: null, success: true };
}
