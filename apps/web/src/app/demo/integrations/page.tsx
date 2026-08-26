"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, DEMO_INTEGRATION_PROVIDERS, type DemoIntegrationProvider } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const categoryLabel: Record<string, string> = {
  mobile_money: "Mobile Money",
  gateway: "Payment Gateway",
  bank_rail: "Bank Rail",
  card: "Card Network",
};

function ConnectModal({ provider, onClose }: { provider: DemoIntegrationProvider; onClose: () => void }) {
  const { connectProviderIntegration } = useDemo();
  const { push } = useToast();
  const [accountLabel, setAccountLabel] = useState("");

  return (
    <Modal open onClose={onClose} title={`Connect ${provider.name}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!accountLabel.trim()) return;
          connectProviderIntegration(provider.key, accountLabel.trim());
          push(`${provider.name} connected`);
          onClose();
        }}
      >
        <p className="text-sm text-text-tertiary">
          Enter the {provider.name} merchant details from your own {provider.name} account. This sandbox does not
          store or send anything real, it just shows how the connection would look.
        </p>
        <FormField label="Label for this connection" htmlFor="accountLabel" required hint="e.g. your registered phone number">
          <Input id="accountLabel" required value={accountLabel} onChange={(e) => setAccountLabel(e.target.value)} />
        </FormField>
        <FormField label="API key" htmlFor="apiKey">
          <Input id="apiKey" type="password" placeholder="Not stored in this sandbox" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Connect</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoIntegrationsPage() {
  const { integrationConnections, disconnectProviderIntegration } = useDemo();
  const { push } = useToast();
  const [connecting, setConnecting] = useState<DemoIntegrationProvider | null>(null);

  const connectionByProvider = new Map(integrationConnections.map((c) => [c.providerKey, c]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Administration" title="Integrations" />
      <p className="-mt-4 text-sm text-text-secondary">
        Connect the local payment rails your business already uses, with your own merchant credentials. Once
        connected, a provider becomes a real payment method on your invoices, POS sales, and purchase payments.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_INTEGRATION_PROVIDERS.map((provider) => {
          const connection = connectionByProvider.get(provider.key);
          const connected = !!connection;
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
              <div className="mt-auto pt-2">
                {connected ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      disconnectProviderIntegration(provider.key);
                      push(`${provider.name} disconnected`);
                    }}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setConnecting(provider)}>
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {connecting && <ConnectModal provider={connecting} onClose={() => setConnecting(null)} />}
    </div>
  );
}
