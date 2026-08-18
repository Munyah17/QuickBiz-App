"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createWorkOrderAction, initialWorkOrderActionState } from "./actions";
import type { BomListRow } from "@/services/manufacturing";
import type { BranchWarehouse } from "@/services/products";

function WorkOrderForm({
  boms,
  warehouses,
  onClose,
}: {
  boms: BomListRow[];
  warehouses: BranchWarehouse[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createWorkOrderAction, initialWorkOrderActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Work order created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New work order">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Bill of materials" htmlFor="bomId" required>
          <Select id="bomId" name="bomId" required defaultValue="">
            <option value="" disabled>
              Choose a BOM
            </option>
            {boms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.productName})
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Warehouse" htmlFor="warehouseId" required>
            <Select id="warehouseId" name="warehouseId" required defaultValue="">
              <option value="" disabled>
                Choose a warehouse
              </option>
              {warehouses.map((w) => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.branchName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Quantity to produce" htmlFor="quantityPlanned" required>
            <Input id="quantityPlanned" name="quantityPlanned" type="number" min="1" step="1" required />
          </FormField>
        </div>

        <FormField label="Scheduled date" htmlFor="scheduledDate">
          <Input id="scheduledDate" name="scheduledDate" type="date" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create work order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewWorkOrderModal({ boms, warehouses }: { boms: BomListRow[]; warehouses: BranchWarehouse[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Work Order
      </Button>
      {open && <WorkOrderForm boms={boms} warehouses={warehouses} onClose={() => setOpen(false)} />}
    </>
  );
}
