import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { requireOrgContext } from "@/lib/session";
import { listModulesForOrg, IMPLEMENTED_MODULE_KEYS } from "@/services/modules";
import { ModuleToggleButton } from "./ModuleToggleButton";

export default async function ModulesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const modules = await listModulesForOrg(supabase, orgId);
  const canManage = permissions.has("modules.manage");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Company" title="Module Store" />
      <p className="-mt-4 text-sm text-text-secondary">
        This is the real activation catalog and pricing every module plugs into. You only pay for what you
        enable. Modules without a working implementation yet stay honestly disabled.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const implemented = IMPLEMENTED_MODULE_KEYS.has(mod.key);
          const enabled = mod.status === "enabled";
          return (
            <Card key={mod.key} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{mod.name}</p>
                  <p className="text-xs uppercase tracking-wide text-text-tertiary">{mod.category}</p>
                </div>
                <Badge tone={implemented ? (enabled ? "success" : "neutral") : "neutral"}>
                  {implemented ? (enabled ? "Enabled" : "Available") : "Coming soon"}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">{mod.description}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-text-primary">
                  ${mod.monthly_price_usd.toFixed(2)}
                  <span className="text-xs font-normal text-text-tertiary">/mo</span>
                </span>
                {implemented ? (
                  <ModuleToggleButton
                    moduleKey={mod.key}
                    moduleName={mod.name}
                    enabled={enabled}
                    canManage={canManage}
                  />
                ) : (
                  <Button size="sm" variant="secondary" disabled title="Not yet available in this build">
                    Enable
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
