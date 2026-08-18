import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

const BUCKET = "documents";

export interface DocumentRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string | null;
  expiry_date: string | null;
  branchName: string | null;
  uploadedByName: string | null;
  created_at: string;
}

export async function listDocuments(supabase: SupabaseClient, orgId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, title, category, description, file_name, storage_path, file_size, mime_type, expiry_date, created_at, branches(name), profiles(full_name)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<
      Omit<DocumentRow, "branchName" | "uploadedByName"> & {
        branches: { name: string } | null;
        profiles: { full_name: string | null } | null;
      }
    >
  ).map((row) => ({
    ...row,
    branchName: row.branches?.name ?? null,
    uploadedByName: row.profiles?.full_name ?? null,
  }));
}

export interface DocumentUploadInput {
  title: string;
  category: string;
  description: string;
  branchId: string;
  expiryDate: string;
  file: File;
}

export async function uploadDocument(supabase: SupabaseClient, orgId: string, input: DocumentUploadInput) {
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${orgId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, input.file, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("documents").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    title: input.title,
    category: input.category,
    description: input.description || null,
    file_name: input.file.name,
    storage_path: storagePath,
    file_size: input.file.size,
    mime_type: input.file.type || null,
    expiry_date: input.expiryDate || null,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw insertError;
  }
}

export async function getDocumentForDownload(
  supabase: SupabaseClient,
  orgId: string,
  documentId: string
): Promise<{ signedUrl: string; fileName: string } | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("storage_path, file_name")
    .eq("org_id", orgId)
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.storage_path, 60);
  if (signError) throw signError;

  return { signedUrl: signed.signedUrl, fileName: data.file_name };
}

export async function deleteDocument(supabase: SupabaseClient, orgId: string, documentId: string) {
  const { data, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("org_id", orgId)
    .eq("id", documentId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!data) return;

  const { error: deleteRowError } = await supabase.from("documents").delete().eq("id", documentId);
  if (deleteRowError) throw deleteRowError;

  await supabase.storage.from(BUCKET).remove([data.storage_path]);
}
