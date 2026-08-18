"use client";

import { useActionState, useEffect, useState } from "react";
import { Fuel } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { logFuelAction, initialVehicleActionState } from "./actions";

function FuelForm({ vehicleId, registration, currentOdometer, onClose }: { vehicleId: string; registration: string; currentOdometer: number; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(logFuelAction, initialVehicleActionState);
  const { push } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      push("Fuel logged");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Log fuel: ${registration}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="vehicleId" value={vehicleId} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Liters" htmlFor="liters" required>
            <Input id="liters" name="liters" type="number" min="0.01" step="0.01" required />
          </FormField>
          <FormField label="Cost" htmlFor="cost">
            <Input id="cost" name="cost" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Odometer (km)" htmlFor="odometerKm" hint={`Current: ${currentOdometer}`}>
            <Input id="odometerKm" name="odometerKm" type="number" min="0" step="0.1" />
          </FormField>
          <FormField label="Date" htmlFor="fuelDate">
            <Input id="fuelDate" name="fuelDate" type="date" defaultValue={today} />
          </FormField>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Log fuel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function LogFuelModal({ vehicleId, registration, currentOdometer }: { vehicleId: string; registration: string; currentOdometer: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Log fuel" className="text-text-tertiary hover:text-primary-600">
        <Fuel className="size-4" />
      </button>
      {open && <FuelForm vehicleId={vehicleId} registration={registration} currentOdometer={currentOdometer} onClose={() => setOpen(false)} />}
    </>
  );
}
