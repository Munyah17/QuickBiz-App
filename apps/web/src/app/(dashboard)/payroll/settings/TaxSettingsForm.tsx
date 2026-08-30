"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { Card, CardHeader } from "@/components/Card";
import { useToast } from "@/components/Toast";
import { updateTaxSettingsAction, initialPayrollSettingsActionState } from "./actions";
import type { PayeBand, PayrollTaxSettings } from "@/services/payroll";

export function TaxSettingsForm({ settings }: { settings: PayrollTaxSettings }) {
  const [state, formAction, isPending] = useActionState(updateTaxSettingsAction, initialPayrollSettingsActionState);
  const [bands, setBands] = useState<PayeBand[]>(settings.payeBands.length > 0 ? settings.payeBands : []);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Tax settings saved");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  function addBand() {
    setBands((prev) => [...prev, { upTo: null, rate: 0, deduct: 0 }]);
  }

  function removeBand(index: number) {
    setBands((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBand(index: number, patch: Partial<PayeBand>) {
    setBands((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  const isUnconfigured = bands.length === 0 && settings.nssaEmployeeRate === 0 && settings.aidsLevyRate === 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isUnconfigured && (
        <div className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            No PAYE bands or statutory rates are configured yet - every payroll run will withhold $0 in PAYE/NSSA/AIDS
            Levy until you enter real figures below. QuickBiz does not ship with these pre-filled; confirm current
            rates with ZIMRA or your tax advisor.
          </p>
        </div>
      )}

      <Card>
        <CardHeader
          title="PAYE bands"
          action={
            <Button type="button" size="sm" variant="secondary" onClick={addBand}>
              <Plus className="size-4" />
              Add band
            </Button>
          }
        />
        <div className="flex flex-col gap-3 p-4">
          {bands.length === 0 ? (
            <p className="text-sm text-text-tertiary">No bands configured. Add at least one bracket.</p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <span>Up to (gross)</span>
                <span>Rate %</span>
                <span>Quick deduction</span>
                <span />
              </div>
              {bands.map((band, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    name="bandUpTo"
                    placeholder="No limit"
                    value={band.upTo ?? ""}
                    onChange={(e) => updateBand(i, { upTo: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    name="bandRate"
                    value={band.rate}
                    onChange={(e) => updateBand(i, { rate: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    name="bandDeduct"
                    value={band.deduct}
                    onChange={(e) => updateBand(i, { deduct: Number(e.target.value) })}
                  />
                  <button type="button" onClick={() => removeBand(i)} className="text-text-tertiary hover:text-danger-600">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-text-tertiary">
                Bands are evaluated in order; leave the last band&apos;s &quot;Up to&quot; blank for the top, uncapped
                bracket. Tax for a bracket = gross pay &times; rate% &minus; quick deduction.
              </p>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="NSSA employee rate %" htmlFor="nssaEmployeeRate">
          <Input id="nssaEmployeeRate" name="nssaEmployeeRate" type="number" min="0" step="0.01" defaultValue={settings.nssaEmployeeRate} />
        </FormField>
        <FormField label="NSSA employer rate %" htmlFor="nssaEmployerRate">
          <Input id="nssaEmployerRate" name="nssaEmployerRate" type="number" min="0" step="0.01" defaultValue={settings.nssaEmployerRate} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="NSSA insurable ceiling" htmlFor="nssaInsurableCeiling" hint="Leave blank for no cap">
          <Input
            id="nssaInsurableCeiling"
            name="nssaInsurableCeiling"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.nssaInsurableCeiling ?? ""}
          />
        </FormField>
        <FormField label="AIDS Levy rate %" htmlFor="aidsLevyRate" hint="Applied to PAYE payable, not gross pay">
          <Input id="aidsLevyRate" name="aidsLevyRate" type="number" min="0" step="0.01" defaultValue={settings.aidsLevyRate} />
        </FormField>
      </div>

      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          Save tax settings
        </Button>
      </div>
    </form>
  );
}
