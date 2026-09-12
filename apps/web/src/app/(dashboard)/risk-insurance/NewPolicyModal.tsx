"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createPolicyAction, initialRiskInsuranceActionState } from "./actions";
import type { InsurerRow } from "@/services/riskInsurance";
import type { AssetRow } from "@/services/assets";
import type { VehicleRow } from "@/services/fleet";

const POLICY_TYPES = [
  "property",
  "liability",
  "workers_comp",
  "vehicle",
  "health",
  "life",
  "business_interruption",
  "cyber",
  "other",
];

function NewPolicyForm({
  insurers,
  assets,
  vehicles,
  onClose,
}: {
  insurers: InsurerRow[];
  assets: AssetRow[];
  vehicles: VehicleRow[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createPolicyAction, initialRiskInsuranceActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Policy created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New Insurance Policy">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Insurer" htmlFor="insurerId">
          <Select id="insurerId" name="insurerId" defaultValue={insurers[0]?.id ?? ""} required>
            {insurers.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Policy Number" htmlFor="policyNumber">
          <Input id="policyNumber" name="policyNumber" required />
        </FormField>

        <FormField label="Policy Type" htmlFor="policyType">
          <Select id="policyType" name="policyType" defaultValue={POLICY_TYPES[0]} required>
            {POLICY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Coverage Type" htmlFor="coverageType">
          <Input id="coverageType" name="coverageType" />
        </FormField>

        <FormField label="Covered Asset" htmlFor="assetId">
          <Select id="assetId" name="assetId" defaultValue="">
            <option value="">None</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Covered Vehicle" htmlFor="vehicleId">
          <Select id="vehicleId" name="vehicleId" defaultValue="">
            <option value="">None</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration_number}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Sum Insured" htmlFor="sumInsured">
          <Input id="sumInsured" name="sumInsured" type="number" step="0.01" min={0} />
        </FormField>

        <FormField label="Premium" htmlFor="premium">
          <Input id="premium" name="premium" type="number" step="0.01" min={0} required />
        </FormField>

        <FormField label="Start Date" htmlFor="startDate">
          <Input id="startDate" name="startDate" type="date" required />
        </FormField>

        <FormField label="End Date" htmlFor="endDate">
          <Input id="endDate" name="endDate" type="date" required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create Policy
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewPolicyModal({
  insurers,
  assets,
  vehicles,
}: {
  insurers: InsurerRow[];
  assets: AssetRow[];
  vehicles: VehicleRow[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={insurers.length === 0}>
        <Plus className="size-4" />
        New Policy
      </Button>
      {open && <NewPolicyForm insurers={insurers} assets={assets} vehicles={vehicles} onClose={() => setOpen(false)} />}
    </>
  );
}
