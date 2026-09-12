"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createWarehouseBinAction, initialWarehousingActionState } from "./actions";
import type { WarehouseZoneRow } from "@/services/warehousing";

const BIN_TYPES = ["shelf", "pallet", "bin", "rack", "floor"];

function NewBinForm({ zones, onClose }: { zones: WarehouseZoneRow[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createWarehouseBinAction, initialWarehousingActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Bin added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Add Storage Bin">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Zone" htmlFor="zoneId">
          <Select id="zoneId" name="zoneId" required>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.warehouseName} - {z.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Code" htmlFor="code">
          <Input id="code" name="code" required />
        </FormField>

        <FormField label="Name" htmlFor="name">
          <Input id="name" name="name" />
        </FormField>

        <FormField label="Bin Type" htmlFor="binType">
          <Select id="binType" name="binType" defaultValue={BIN_TYPES[0]}>
            {BIN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Add Bin
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewBinModal({ zones }: { zones: WarehouseZoneRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} disabled={zones.length === 0}>
        <Plus className="size-4" />
        Add Bin
      </Button>
      {open && <NewBinForm zones={zones} onClose={() => setOpen(false)} />}
    </>
  );
}
