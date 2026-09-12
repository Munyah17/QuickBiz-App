"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createTaxFilingAction, initialTaxComplianceActionState } from "./actions";
import type { TaxTypeRow } from "@/services/taxCompliance";

function NewTaxFilingForm({ taxTypes, onClose }: { taxTypes: TaxTypeRow[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createTaxFilingAction, initialTaxComplianceActionState);
  const { push } = useToast();
  const [taxTypeKey, setTaxTypeKey] = useState(taxTypes[0]?.key ?? "");

  const selectedType = taxTypes.find((t) => t.key === taxTypeKey);
  const periodLabel =
    selectedType?.frequency === "monthly" ? "Month (1-12)" : selectedType?.frequency === "quarterly" ? "Quarter (1-4)" : "Period";

  useEffect(() => {
    if (state.success) {
      push("Tax filing created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New Tax Filing">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Tax Type" htmlFor="taxTypeKey">
          <Select id="taxTypeKey" name="taxTypeKey" value={taxTypeKey} onChange={(e) => setTaxTypeKey(e.target.value)}>
            {taxTypes.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Year" htmlFor="year">
          <Input id="year" name="year" type="number" defaultValue={new Date().getFullYear()} required />
        </FormField>

        <FormField label={periodLabel} htmlFor="period">
          <Input id="period" name="period" type="number" min={1} required />
        </FormField>

        <FormField label="Amount" htmlFor="amount">
          <Input id="amount" name="amount" type="number" step="0.01" min={0} required />
        </FormField>

        <FormField label="Currency" htmlFor="currency">
          <Input id="currency" name="currency" defaultValue="USD" required />
        </FormField>

        <p className="text-sm text-text-tertiary">
          This creates a tax period and a draft filing to track - it does not submit anything to ZIMRA.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create Filing
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewTaxFilingModal({ taxTypes }: { taxTypes: TaxTypeRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Filing
      </Button>
      {open && <NewTaxFilingForm taxTypes={taxTypes} onClose={() => setOpen(false)} />}
    </>
  );
}
