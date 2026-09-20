import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { requireDeveloper } from "@/lib/developer-session";
import { listUsage } from "@/services/developers";

export default async function UsagePage() {
  const { supabase, developer } = await requireDeveloper();
  const usage = await listUsage(supabase, developer.id, 200);

  const totalTokens = usage.reduce((s, u) => s + u.tokensUsed, 0);
  const byEndpoint = usage.reduce<Record<string, { calls: number; tokens: number }>>((acc, u) => {
    const key = `${u.method} ${u.endpoint}`;
    acc[key] = acc[key] ?? { calls: 0, tokens: 0 };
    acc[key]!.calls += 1;
    acc[key]!.tokens += u.tokensUsed;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="API Usage" />

      <div className="grid max-w-3xl grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Calls (recent 200)</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{usage.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Tokens consumed</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{totalTokens.toLocaleString()}</p>
        </Card>
      </div>

      <Card className="max-w-3xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">By endpoint</h3>
        {Object.keys(byEndpoint).length === 0 ? (
          <p className="text-sm text-text-tertiary">No usage yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {Object.entries(byEndpoint)
              .sort((a, b) => b[1].tokens - a[1].tokens)
              .map(([endpoint, stats]) => (
                <div key={endpoint} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-text-secondary">{endpoint}</span>
                  <span className="text-text-tertiary">
                    {stats.calls} calls · {stats.tokens.toLocaleString()} tok
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>

      <Card className="max-w-3xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Recent calls</h3>
        {usage.length === 0 ? (
          <p className="text-sm text-text-tertiary">No calls logged.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {usage.slice(0, 50).map((u) => (
              <div key={u.id} className="flex items-center justify-between text-xs">
                <span className="font-mono text-text-secondary">
                  {u.method} {u.endpoint}
                </span>
                <span className="text-text-tertiary">
                  {u.tokensUsed} tok · {u.statusCode} · {new Date(u.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
