"use client";

import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { deleteDocumentAction, initialDocumentActionState } from "./actions";

export function DeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const [state, formAction, isPending] = useActionState(deleteDocumentAction, initialDocumentActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md p-1.5 text-text-tertiary hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
        aria-label={`Delete ${title}`}
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
