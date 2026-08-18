"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createCampaignAction, initialCampaignActionState } from "./actions";

const CHANNELS = ["sms", "email", "whatsapp", "social", "other"];

function CampaignForm({ branches, onClose }: { branches: Array<{ id: string; name: string }>; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createCampaignAction, initialCampaignActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Campaign created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New campaign">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" name="name" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Channel" htmlFor="channel">
            <Select id="channel" name="channel" defaultValue="other">
              {CHANNELS.map((c) => (
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

        <FormField label="Target audience" htmlFor="targetSegment">
          <Input id="targetSegment" name="targetSegment" placeholder="e.g. All active customers in Harare" />
        </FormField>

        <FormField label="Message" htmlFor="message" required>
          <Textarea id="message" name="message" required />
        </FormField>

        <FormField label="Scheduled for" htmlFor="scheduledAt">
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewCampaignModal({ branches }: { branches: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Campaign
      </Button>
      {open && <CampaignForm branches={branches} onClose={() => setOpen(false)} />}
    </>
  );
}
