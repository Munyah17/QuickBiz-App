import { Plug } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import type { ConnectedSocialAccountRow } from "@/services/socialMedia";

export function ConnectedAccountsTable({ accounts }: { accounts: ConnectedSocialAccountRow[] }) {
  return (
    <Card>
      {accounts.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No accounts connected"
          description="Connect a social account to start queueing posts for it."
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Platform</th>
              <th className="px-4 py-2.5">Account</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Connected</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium capitalize text-text-primary">{a.platformKey}</td>
                <td className="px-4 py-2.5 text-text-secondary">{a.accountName}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={a.isActive ? "success" : "neutral"}>{a.isActive ? "active" : "inactive"}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
