import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listProviders, listConnections, type IntegrationProvider } from "@/services/integrations";
import { ConnectButton } from "./ConnectButton";
import { DisconnectButton } from "./DisconnectButton";

const categoryLabel: Record<string, string> = {
  mobile_money: "Mobile Money",
  gateway: "Payment Gateway",
  bank_rail: "Bank Rail",
  card: "Card Network",
  sms: "SMS & Messaging",
  tax: "Tax & Regulatory",
};

const SECTION_ORDER: Array<{ title: string; categories: string[] }> = [
  { title: "Payments, Mobile Money & Banking", categories: ["mobile_money", "gateway", "bank_rail", "card"] },
  { title: "SMS & Messaging", categories: ["sms"] },
  { title: "Tax & Regulatory", categories: ["tax"] },
];

export default async function IntegrationsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "local_services");
  const canManage = permissions.has("integrations.manage");

  const [providers, connections] = await Promise.all([listProviders(supabase), listConnections(supabase, orgId)]);
  const connectionByProvider = new Map(connections.map((c) => [c.providerKey, c]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Local Services" />
      <p className="-mt-4 text-sm text-text-secondary">
        Every local payment, mobile money, banking, SMS, and tax service your business already uses, pre-built and
        ready to connect with your own credentials, no separate integration project required. Once connected, a
        provider becomes a real payment method on your invoices, POS sales, and purchase payments. QuickBiz does not
        yet initiate live charges or send messages through these providers on your behalf, this records which
        provider a transaction moved through, using your own account.
      </p>

      {SECTION_ORDER.map((section) => {
        const sectionProviders = providers.filter((p) => section.categories.includes(p.category));
        if (sectionProviders.length === 0) return null;
        return (
          <div key={section.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text-primary">{section.title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionProviders.map((provider: IntegrationProvider) => {
                const connection = connectionByProvider.get(provider.key);
                const connected = connection?.isConnected ?? false;
                return (
                  <Card key={provider.key} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{provider.name}</p>
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">{categoryLabel[provider.category] ?? provider.category}</p>
                      </div>
                      <Badge tone={connected ? "success" : "neutral"}>{connected ? "Connected" : "Not connected"}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{provider.description}</p>
                    {connected && connection && <p className="text-xs text-text-tertiary">Account: {connection.accountLabel}</p>}
                    {canManage && (
                      <div className="mt-auto pt-2">
                        {connected ? (
                          <DisconnectButton providerKey={provider.key} providerName={provider.name} />
                        ) : (
                          <ConnectButton provider={provider} />
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
