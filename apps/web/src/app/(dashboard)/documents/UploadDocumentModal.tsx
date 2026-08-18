"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { uploadDocumentAction, initialDocumentActionState } from "./actions";

const CATEGORIES = ["general", "contract", "invoice", "license", "policy", "compliance"];

function UploadForm({ branches, onClose }: { branches: Array<{ id: string; name: string }>; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(uploadDocumentAction, initialDocumentActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Document uploaded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Upload document">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required>
          <Input id="title" name="title" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" htmlFor="category">
            <Select id="category" name="category" defaultValue="general">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Branch" htmlFor="branchId">
            <Select id="branchId" name="branchId">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" />
        </FormField>

        <FormField label="Expiry date" htmlFor="expiryDate">
          <Input id="expiryDate" name="expiryDate" type="date" />
        </FormField>

        <FormField label="File" htmlFor="file" required>
          <Input id="file" name="file" type="file" required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UploadDocumentModal({ branches }: { branches: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Upload Document
      </Button>
      {open && <UploadForm branches={branches} onClose={() => setOpen(false)} />}
    </>
  );
}
