"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { queueSocialPostAction, initialSocialMediaActionState } from "./actions";

const PLATFORMS = [
  { key: "facebook", name: "Facebook" },
  { key: "twitter", name: "Twitter/X" },
  { key: "linkedin", name: "LinkedIn" },
  { key: "instagram", name: "Instagram" },
  { key: "tiktok", name: "TikTok" },
];

function ComposePostForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(queueSocialPostAction, initialSocialMediaActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Post queued");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Compose Post">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Content" htmlFor="content">
          <Textarea id="content" name="content" required />
        </FormField>

        <FormField label="Platforms" htmlFor="platforms">
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((p) => (
              <label key={p.key} className="flex items-center gap-1.5 text-sm text-text-secondary">
                <input type="checkbox" name="platforms" value={p.key} className="size-4 rounded border-border" />
                {p.name}
              </label>
            ))}
          </div>
        </FormField>

        <p className="text-sm text-text-tertiary">
          QuickBiz does not send posts to any platform yet - queueing marks the post "queued" and creates "pending"
          records for each platform, awaiting a future real integration.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Queue Post
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ComposePostModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Compose Post
      </Button>
      {open && <ComposePostForm onClose={() => setOpen(false)} />}
    </>
  );
}
