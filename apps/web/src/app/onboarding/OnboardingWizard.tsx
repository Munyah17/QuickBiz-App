"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Check, LayoutGrid, CreditCard, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createOrganizationAction, completeOnboardingAction } from "./actions";
import type { ModulePricing } from "@/services/billing";

const STEP_LABELS = ["Company", "Modules", "Payment"];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function OnboardingWizard({
  orgId: initialOrgId,
  catalog,
  setupFeeUsd,
  alreadyEnabled,
}: {
  /** Set when the user already created an org but never finished setup. */
  orgId: string | null;
  catalog: ModulePricing[];
  setupFeeUsd: number;
  alreadyEnabled: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialOrgId ? 2 : 1);
  const [orgId, setOrgId] = useState<string | null>(initialOrgId);
  const [companyName, setCompanyName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(alreadyEnabled));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedModules = catalog.filter((m) => selected.has(m.key));
  const monthlyTotal = selectedModules.reduce((sum, m) => sum + m.monthly_price_usd, 0);

  const toggleModule = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const submitCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("companyName", companyName);
    startTransition(async () => {
      const res = await createOrganizationAction(fd);
      if (res.error || !res.orgId) {
        setError(res.error ?? "Could not create your workspace.");
        return;
      }
      setOrgId(res.orgId);
      setStep(2);
    });
  };

  const submitCheckout = () => {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboardingAction([...selected]);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
    });
  };

  const categories = [...new Set(catalog.map((m) => m.category))];

  return (
    <div className="flex min-h-screen flex-col items-center bg-workspace px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary-600">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">QuickBiz ERP</span>
      </div>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-medium">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-6 bg-border sm:w-10" />}
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border",
                  done && "border-success-500 bg-success-500 text-white",
                  current && "border-primary-600 bg-primary-600 text-white",
                  !done && !current && "border-border bg-surface text-text-tertiary",
                )}
              >
                {done ? <Check className="size-3.5" /> : n}
              </span>
              <span className={cn(current ? "text-text-primary" : "text-text-tertiary")}>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className={cn("w-full", step === 1 ? "max-w-sm" : "max-w-3xl")}>
        {step === 1 && (
          <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
            <h1 className="mb-1 text-lg font-semibold text-text-primary">Create your organization</h1>
            <p className="mb-5 text-sm text-text-secondary">This is the workspace your team will sign in to.</p>
            <form onSubmit={submitCompany} className="flex flex-col gap-4">
              <FormField label="Company name" htmlFor="companyName" required>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Acme Trading (Pvt) Ltd"
                />
              </FormField>
              {error && <p className="text-sm text-danger-600">{error}</p>}
              <Button type="submit" loading={pending} className="w-full">
                Continue
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-5 text-center">
              <h1 className="text-xl font-semibold text-text-primary">Choose your modules</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Pay only for what you use — every module is billed monthly and can be switched on or off anytime in the Module Store.
              </p>
            </div>

            {categories.map((category) => (
              <div key={category} className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">{category}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catalog
                    .filter((m) => m.category === category)
                    .map((m) => {
                      const on = selected.has(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => toggleModule(m.key)}
                          aria-pressed={on}
                          className={cn(
                            "flex flex-col gap-1 rounded-lg border p-4 text-left shadow-card transition-colors",
                            on
                              ? "border-primary-600 bg-primary-50 ring-1 ring-primary-600"
                              : "border-border bg-surface hover:border-primary-300",
                          )}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-text-primary">{m.name}</span>
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                                on ? "border-primary-600 bg-primary-600 text-white" : "border-border",
                              )}
                            >
                              {on && <Check className="size-3" />}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">{m.description}</p>
                          <p className="mt-1 text-sm font-semibold text-primary-600">
                            {money(m.monthly_price_usd)}<span className="text-xs font-normal text-text-tertiary">/mo</span>
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}

            {error && <p className="mb-3 text-sm text-danger-600">{error}</p>}

            <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-popover">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {selected.size} module{selected.size === 1 ? "" : "s"} selected
                </p>
                <p className="text-xs text-text-secondary">
                  {money(monthlyTotal)}/mo + {money(setupFeeUsd)} one-time setup
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={pending}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} disabled={selected.size === 0}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card lg:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="size-5 text-primary-600" />
                <h1 className="text-lg font-semibold text-text-primary">Payment</h1>
              </div>
              <p className="mb-4 text-sm text-text-secondary">
                Our team finalizes billing securely after activation — you&apos;ll receive an invoice and payment link
                by email. Your workspace unlocks immediately.
              </p>
              <div className="rounded-md border border-border bg-workspace p-4">
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-text-secondary">One-time setup fee</span>
                  <span className="font-medium text-text-primary">{money(setupFeeUsd)}</span>
                </div>
                {selectedModules.map((m) => (
                  <div key={m.key} className="flex justify-between py-1.5 text-sm">
                    <span className="text-text-secondary">{m.name} — monthly</span>
                    <span className="font-medium text-text-primary">{money(m.monthly_price_usd)}/mo</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-border pt-3 text-sm">
                  <span className="font-semibold text-text-primary">Due today</span>
                  <span className="font-semibold text-text-primary">{money(setupFeeUsd)}</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-text-secondary">Then monthly</span>
                  <span className="font-medium text-text-primary">{money(monthlyTotal)}/mo</span>
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
            </div>

            <div className="flex flex-col gap-3 lg:col-span-2">
              <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <LayoutGrid className="size-4 text-primary-600" /> What happens next
                </p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• Your {selected.size} module{selected.size === 1 ? "" : "s"} switch on instantly.</li>
                  <li>• The sidebar fills with the features you chose.</li>
                  <li>• An invoice for the setup fee + first month is emailed to you.</li>
                  <li>• Add or remove modules anytime — billing follows usage.</li>
                </ul>
              </div>
              <Button type="button" onClick={submitCheckout} loading={pending} className="w-full">
                {pending ? "Activating…" : "Pay & activate workspace"}
                {!pending && <ArrowRight className="size-4" />}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={pending} className="w-full">
                <ArrowLeft className="size-4" /> Change modules
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
