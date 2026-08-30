"use client";

import { useMemo, useState, useTransition } from "react";
import { Megaphone } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { CampaignStatusSelect } from "./CampaignStatusSelect";
import { bulkSetCampaignStatusAction } from "./actions";
import type { CampaignRow } from "@/services/marketing";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  scheduled: "info",
  sent: "success",
  cancelled: "danger",
};

export function CampaignsTable({ campaigns, canManage }: { campaigns: CampaignRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;
      if (!q) return true;
      return [c.name, c.message, c.target_segment].some((field) => field?.toLowerCase().includes(q));
    });
  }, [campaigns, query, statusFilter, channelFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((c) => c.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetCampaignStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} campaign${ids.length === 1 ? "" : "s"} updated`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {campaigns.length} campaigns
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, message, segment..." />
          <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="w-32">
            <option value="all">All channels</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ExportButton
            filename="campaigns"
            rows={filtered.map((c) => ({
              Name: c.name,
              Channel: c.channel,
              Audience: c.target_segment ?? "",
              Scheduled: c.scheduled_at ?? "",
              Sent: c.sent_at ?? "",
              Status: c.status,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("scheduled")}>
            Mark Scheduled
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("sent")}>
            Mark Sent
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("cancelled")}>
            Cancel
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Channel</th>
              <th className="px-4 py-2.5">Audience</th>
              <th className="px-4 py-2.5">Scheduled</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <p className="font-medium text-text-primary">{c.name}</p>
                  <p className="max-w-md truncate text-xs text-text-tertiary">{c.message}</p>
                </td>
                <td className="px-4 py-2.5">
                  <Badge>{c.channel}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{c.target_segment ?? "Not specified"}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : "Not scheduled"}
                </td>
                <td className="px-4 py-2.5">
                  {canManage ? (
                    <CampaignStatusSelect campaignId={c.id} status={c.status} />
                  ) : (
                    <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
