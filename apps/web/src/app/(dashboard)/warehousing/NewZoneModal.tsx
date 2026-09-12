"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createWarehouseZoneAction, initialWarehousingActionState } from "./actions";
import type { WarehouseRow } from "@/services/warehousing";

const ZONE_TYPES = ["receiving", "storage", "picking", "packing", "shipping", "quarantine", "returns"];

function NewZoneForm({ warehouses, onClose }: { warehouses: WarehouseRow[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createWarehouseZoneAction, initialWarehousingActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Zone added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Add Storage Zone">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Warehouse" htmlFor="warehouseId">
          <Select id="warehouseId" name="warehouseId" required>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Code" htmlFor="code">
          <Input id="code" name="code" required />
        </FormField>

        <FormField label="Name" htmlFor="name">
          <Input id="name" name="name" required />
        </FormField>

        <FormField label="Zone Type" htmlFor="zoneType">
          <Select id="zoneType" name="zoneType" defaultValue={ZONE_TYPES[1]}>
            {ZONE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Area (sq m)" htmlFor="area">
          <Input id="area" name="area" type="number" step="0.01" min={0} />
        </FormField>

        <FormField label="Capacity Volume (cubic m)" htmlFor="capacityVolume">
          <Input id="capacityVolume" name="capacityVolume" type="number" step="0.01" min={0} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Add Zone
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewZoneModal({ warehouses }: { warehouses: WarehouseRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} disabled={warehouses.length === 0}>
        <Plus className="size-4" />
        Add Zone
      </Button>
      {open && <NewZoneForm warehouses={warehouses} onClose={() => setOpen(false)} />}
    </>
  );
}
