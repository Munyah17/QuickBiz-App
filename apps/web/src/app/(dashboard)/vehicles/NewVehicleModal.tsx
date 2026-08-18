"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createVehicleAction, initialVehicleActionState } from "./actions";

function VehicleForm({
  branches,
  employees,
  onClose,
}: {
  branches: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; full_name: string }>;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialVehicleActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Vehicle added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New vehicle">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Registration number" htmlFor="registrationNumber" required>
            <Input id="registrationNumber" name="registrationNumber" required placeholder="ADX 1234" />
          </FormField>
          <FormField label="Driver" htmlFor="driverId">
            <Select id="driverId" name="driverId">
              <option value="">No driver assigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Make" htmlFor="make">
            <Input id="make" name="make" placeholder="Toyota" />
          </FormField>
          <FormField label="Model" htmlFor="model">
            <Input id="model" name="model" placeholder="Hilux" />
          </FormField>
          <FormField label="Year" htmlFor="year">
            <Input id="year" name="year" type="number" min="1980" max="2100" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Branch" htmlFor="branchId">
            <Select id="branchId" name="branchId">
              <option value="">No branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Odometer (km)" htmlFor="odometerKm">
            <Input id="odometerKm" name="odometerKm" type="number" min="0" step="0.1" defaultValue={0} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Insurance expiry" htmlFor="insuranceExpiry">
            <Input id="insuranceExpiry" name="insuranceExpiry" type="date" />
          </FormField>
          <FormField label="License expiry" htmlFor="licenseExpiry">
            <Input id="licenseExpiry" name="licenseExpiry" type="date" />
          </FormField>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Add vehicle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewVehicleModal({
  branches,
  employees,
}: {
  branches: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; full_name: string }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Vehicle
      </Button>
      {open && <VehicleForm branches={branches} employees={employees} onClose={() => setOpen(false)} />}
    </>
  );
}
