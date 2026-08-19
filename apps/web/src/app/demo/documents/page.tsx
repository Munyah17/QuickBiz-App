"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function UploadDocumentModal({ onClose }: { onClose: () => void }) {
  const { addDocument } = useDemo();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [fileName, setFileName] = useState("");

  return (
    <Modal open onClose={onClose} title="Upload document">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addDocument({ title: title.trim(), category: category.trim(), fileName: fileName.trim() || "document.pdf" });
          push("Document uploaded");
          onClose();
        }}
      >
        <FormField label="Title" htmlFor="title" required>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" htmlFor="category">
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </FormField>
          <FormField label="File" htmlFor="fileName">
            <Input id="fileName" type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </FormField>
        </div>
        <p className="text-xs text-text-tertiary">This is a sandbox: the file itself is not actually stored, only its name.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Upload</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoDocumentsPage() {
  const { documents } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Documents" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Upload Document
        </Button>
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
                <th className="px-4 py-2.5">File</th>
                <th className="px-4 py-2.5">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{d.title}</td>
                  <td className="px-4 py-2.5">
                    <Badge>{d.category}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{d.fileName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <UploadDocumentModal onClose={() => setOpen(false)} />}
    </div>
  );
}
