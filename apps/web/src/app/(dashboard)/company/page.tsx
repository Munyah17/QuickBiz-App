import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext } from "@/lib/session";
import { listCurrencies, getOrgSettings } from "@/services/org";
import { getBillingSummary } from "@/services/billing";
import { CompanyForm } from "./CompanyForm";
import { ThemeColorPicker } from "./ThemeColorPicker";

export default async function CompanyPage() {
  const { supabase, orgId, permissions, themeColor } = await requireOrgContext();

  const [{ data: org }, currencies, settings, billing] = await Promise.all([
    supabase.from("organizations").select("name, legal_name, currency, timezone").eq("id", orgId).single(),
    listCurrencies(supabase),
    getOrgSettings(supabase, orgId),
    getBillingSummary(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Settings" title="Company Profile" />

      <CompanyForm
        name={org?.name ?? ""}
        legalName={org?.legal_name ?? ""}
        currency={org?.currency ?? "USD"}
        timezone={org?.timezone ?? "Africa/Harare"}
        phone={(settings["contact.phone"] as string) ?? ""}
        taxRate={(settings["tax.default_rate"] as string) ?? ""}
        currencies={currencies}
        canManage={permissions.has("settings.manage")}
      />

      <Card>
        <CardHeader title="UI/UX Configurations" />
        <div className="p-4">
          <p className="mb-4 text-sm text-text-secondary">
            Choose a brand color for your organization&apos;s workspace. It drives the sidebar and every
            primary button, link, and highlight across QuickBiz for everyone in {org?.name ?? "your organization"}.
          </p>
          <ThemeColorPicker currentColor={themeColor} canManage={permissions.has("settings.manage")} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Plan & billing" />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Setup fee: ${billing.setupFeeUsd.toFixed(2)} one-time
              </p>
              <p className="text-xs text-text-tertiary">Covers onboarding onto Core (tenancy, users, roles, audit).</p>
            </div>
            <Badge tone={billing.setupFeePaid ? "success" : "warning"}>
              {billing.setupFeePaid ? "Paid" : "Not paid"}
            </Badge>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {billing.enabledModules.length} module{billing.enabledModules.length === 1 ? "" : "s"} enabled
                (${billing.monthlyTotalUsd.toFixed(2)}/mo)
              </p>
              <Badge tone={billing.billingStatus === "active" ? "success" : "warning"}>
                {billing.billingStatus === "pending" ? "Payment required" : billing.billingStatus}
              </Badge>
            </div>
            {billing.enabledModules.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No business modules enabled yet. Visit the Module Store to see what&apos;s available.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {billing.enabledModules.map((m) => (
                  <li key={m.key} className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{m.name}</span>
                    <span>${m.monthly_price_usd.toFixed(2)}/mo</span>
                  </li>
                ))}
              </ul>
            )}
            {billing.billingStatus === "pending" && (
              <p className="mt-3 text-xs text-warning-600">
                Payment isn&apos;t collected online yet. Contact us to activate billing.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
