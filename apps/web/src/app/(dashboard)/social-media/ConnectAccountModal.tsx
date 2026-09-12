"use client";

import { useActionState, useEffect, useState } from "react";
import { Plug } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { connectSocialAccountAction, initialSocialMediaActionState } from "./actions";

const PLATFORMS = [
  { key: "facebook", name: "Facebook" },
  { key: "twitter", name: "Twitter/X" },
  { key: "linkedin", name: "LinkedIn" },
  { key: "instagram", name: "Instagram" },
  { key: "tiktok", name: "TikTok" },
];

function ConnectAccountForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(connectSocialAccountAction, initialSocialMediaActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Social account connected");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Connect Social Account">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Platform" htmlFor="platformKey">
          <Select id="platformKey" name="platformKey" defaultValue="facebook">
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Account ID" htmlFor="accountId" hint="The platform's account or page ID">
          <Input id="accountId" name="accountId" required />
        </FormField>

        <FormField label="Account Name" htmlFor="accountName">
          <Input id="accountName" name="accountName" required />
        </FormField>

        <p className="text-sm text-text-tertiary">
          QuickBiz does not publish to any platform on your behalf yet - connecting an account lets you queue posts
          for a future real integration to send.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Connect Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ConnectAccountModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plug className="size-4" />
        Connect Account
      </Button>
      {open && <ConnectAccountForm onClose={() => setOpen(false)} />}
    </>
  );
}
