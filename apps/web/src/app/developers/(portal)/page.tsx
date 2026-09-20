import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { requireDeveloper } from "@/lib/developer-session";
import {
  getWallet,
  listApiKeys,
  listSubmissions,
  listDeveloperNotifications,
  listUsage,
  TOKENS_PER_USD,
} from "@/services/developers";

export default async function DeveloperDashboard() {
  const { supabase, developer } = await requireDeveloper();
  const [wallet, keys, submissions, notifications, recentUsage] = await Promise.all([
    getWallet(supabase, developer.id),
    listApiKeys(supabase, developer.id),
    listSubmissions(supabase, developer.id),
    listDeveloperNotifications(supabase, developer.id, 5),
    listUsage(supabase, developer.id, 10),
  ]);

  const activeKeys = keys.filter((k) => k.status === "active").length;
  const liveModules = submissions.filter((s) => s.status === "approved").length;
  const pendingModules = submissions.filter((s) => s.status === "pending_review").length;
  const tokensToday = recentUsage
    .filter((u) => new Date(u.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, u) => s + u.tokensUsed, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={`Welcome, ${developer.displayName}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Token balance</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{wallet.tokenBalance.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">${(wallet.tokenBalance / TOKENS_PER_USD).toFixed(2)} value</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Active API keys</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{activeKeys}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Live modules</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{liveModules}</p>
          {pendingModules > 0 && <p className="text-xs text-warning-600">{pendingModules} in review</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Tokens used today</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{tokensToday.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-text-tertiary">No notifications.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-md border border-border-subtle px-3 py-2">
                  <p className="text-sm font-medium text-text-primary">{n.title}</p>
                  {n.body && <p className="text-xs text-text-tertiary">{n.body}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Recent API calls</h3>
          {recentUsage.length === 0 ? (
            <p className="text-sm text-text-tertiary">No API calls yet. Create a key to get started.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {recentUsage.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-text-secondary">
                    {u.method} {u.endpoint}
                  </span>
                  <span className="text-text-tertiary">
                    {u.tokensUsed} tok · {u.statusCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
