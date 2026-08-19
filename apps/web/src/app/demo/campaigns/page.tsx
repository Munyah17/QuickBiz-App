"use client";

import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoCampaign } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const STATUSES: DemoCampaign["status"][] = ["draft", "scheduled", "sent", "cancelled"];

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const { addCampaign } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<DemoCampaign["channel"]>("whatsapp");
  const [message, setMessage] = useState("");

  return (
    <Modal open onClose={onClose} title="New campaign">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !message.trim()) return;
          addCampaign({ name: name.trim(), channel, message: message.trim() });
          push("Campaign created");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Channel" htmlFor="channel">
          <Select id="channel" value={channel} onChange={(e) => setChannel(e.target.value as DemoCampaign["channel"])}>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </Select>
        </FormField>
        <FormField label="Message" htmlFor="message" required>
          <Textarea id="message" required value={message} onChange={(e) => setMessage(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create campaign</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoCampaignsPage() {
  const { campaigns, setCampaignStatus } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Campaigns" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Campaign
        </Button>
      </div>

      <Card>
        {campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Channel</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-text-primary">{c.name}</p>
                    <p className="max-w-md truncate text-xs text-text-tertiary">{c.message}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge>{c.channel}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={c.status}
                      onChange={(e) => setCampaignStatus(c.id, e.target.value as DemoCampaign["status"])}
                      className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewCampaignModal onClose={() => setOpen(false)} />}
    </div>
  );
}
