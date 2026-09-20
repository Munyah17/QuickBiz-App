import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { requireOrgContext } from "@/lib/session";
import { listModulesForOrg, IMPLEMENTED_MODULE_KEYS } from "@/services/modules";
import { listMarketplaceModules } from "@/services/marketplace";
import { ModuleToggleButton } from "./ModuleToggleButton";
import { LicenseButton } from "./LicenseButton";

export default async function ModulesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const [modules, marketplace] = await Promise.all([
    listModulesForOrg(supabase, orgId),
    listMarketplaceModules(supabase, orgId),
  ]);
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

      {marketplace.length > 0 && (
        <>
          <div className="mt-4">
            <h2 className="text-base font-semibold text-text-primary">Community Modules</h2>
            <p className="text-sm text-text-secondary">
              Built by third-party developers. Licensed separately — the developer sets the price.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketplace.map((mod) => (
              <Card key={mod.submissionId} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{mod.name}</p>
                    <p className="text-xs uppercase tracking-wide text-text-tertiary">
                      {mod.category} · by {mod.developerName}
                    </p>
                  </div>
                  <Badge tone={mod.licensed ? "success" : "neutral"}>
                    {mod.licensed ? "Licensed" : `v${mod.version}`}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">{mod.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-text-primary">
                    ${mod.monthlyPriceUsd.toFixed(2)}
                    <span className="text-xs font-normal text-text-tertiary">/mo</span>
                  </span>
                  <LicenseButton submissionId={mod.submissionId} licensed={mod.licensed} canManage={canManage} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
