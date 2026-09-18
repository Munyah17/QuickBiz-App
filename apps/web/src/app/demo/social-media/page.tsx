"use client";

import { useState } from "react";
import { Plus, Plug, Share2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const PLATFORMS = [
  { key: "facebook", name: "Facebook" },
  { key: "twitter", name: "Twitter/X" },
  { key: "linkedin", name: "LinkedIn" },
  { key: "instagram", name: "Instagram" },
  { key: "tiktok", name: "TikTok" },
];

function ConnectAccountModal({ onClose }: { onClose: () => void }) {
  const { connectSocialAccount } = useDemo();
  const { push } = useToast();
  const [platform, setPlatform] = useState("facebook");
  const [handle, setHandle] = useState("");

  return (
    <Modal open onClose={onClose} title="Connect Social Account">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          connectSocialAccount(platform, handle.trim());
          push("Social account connected");
          onClose();
        }}
      >
        <FormField label="Platform" htmlFor="platform">
          <Select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Handle" htmlFor="handle">
          <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} required />
        </FormField>

        <p className="text-sm text-text-tertiary">
          QuickBiz does not publish to any platform on your behalf yet - connecting an account lets you queue posts
          for a future real integration to send.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Connect Account</Button>
        </div>
      </form>
    </Modal>
  );
}

function ComposePostModal({ onClose }: { onClose: () => void }) {
  const { queueSocialPost } = useDemo();
  const { push } = useToast();
  const [platform, setPlatform] = useState("facebook");
  const [message, setMessage] = useState("");

  return (
    <Modal open onClose={onClose} title="Compose Post">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          queueSocialPost(platform, message.trim());
          push("Post queued");
          onClose();
        }}
      >
        <FormField label="Platform" htmlFor="postPlatform">
          <Select id="postPlatform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Message" htmlFor="message">
          <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </FormField>

        <p className="text-sm text-text-tertiary">
          QuickBiz does not send posts to any platform yet - queueing marks the post &quot;queued&quot;, awaiting a future real
          integration.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Queue Post</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoSocialMediaPage() {
  const { socialAccounts, socialPosts } = useDemo();
  const [connectOpen, setConnectOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Social Media" />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConnectOpen(true)}>
            <Plug className="size-4" />
            Connect Account
          </Button>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="size-4" />
            Compose Post
          </Button>
        </div>
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz does not publish to any social platform on your behalf yet - posts stay &quot;queued&quot; until a real
        integration exists to report a genuine send result.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Connected Accounts</h2>
        <Card>
          {socialAccounts.length === 0 ? (
            <EmptyState icon={Plug} title="No accounts connected" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Platform</th>
                  <th className="px-4 py-2.5">Handle</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {socialAccounts.map((a) => (
                  <tr key={a.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 font-medium capitalize text-text-primary">{a.platform}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{a.handle}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={a.connected ? "success" : "neutral"}>{a.connected ? "connected" : "disconnected"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Posts</h2>
        <Card>
          {socialPosts.length === 0 ? (
            <EmptyState icon={Share2} title="No posts yet" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Platform</th>
                  <th className="px-4 py-2.5">Message</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {socialPosts.map((p) => (
                  <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 font-medium capitalize text-text-primary">{p.platform}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{p.message}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={p.status === "queued" ? "warning" : "neutral"}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {connectOpen && <ConnectAccountModal onClose={() => setConnectOpen(false)} />}
      {composeOpen && <ComposePostModal onClose={() => setComposeOpen(false)} />}
    </div>
  );
}
