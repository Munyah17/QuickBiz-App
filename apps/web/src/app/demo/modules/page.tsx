"use client";

import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

export default function DemoModulesPage() {
  const { modules, toggleModule } = useDemo();
  const { push } = useToast();

  const monthlyTotal = modules.filter((m) => m.enabled).reduce((sum, m) => sum + m.monthlyPriceUsd, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Module Store" />
      <p className="-mt-4 text-sm text-text-secondary">
        Toggle a module and watch it appear in the sidebar immediately - this is exactly how module activation
        works for real tenants. Enabled modules total{" "}
        <span className="font-semibold text-text-primary">${monthlyTotal.toFixed(2)}/mo</span> here.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Card key={mod.key} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">{mod.name}</p>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">{mod.category}</p>
              </div>
              <Badge tone={mod.enabled ? "success" : "neutral"}>{mod.enabled ? "Enabled" : "Available"}</Badge>
            </div>
            <p className="text-sm text-text-secondary">{mod.description}</p>
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-text-primary">
                ${mod.monthlyPriceUsd.toFixed(2)}
                <span className="text-xs font-normal text-text-tertiary">/mo</span>
              </span>
              <Button
                size="sm"
                variant={mod.enabled ? "secondary" : "primary"}
                onClick={() => {
                  toggleModule(mod.key);
                  push(mod.enabled ? `${mod.name} disabled` : `${mod.name} enabled`);
                }}
              >
                {mod.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
