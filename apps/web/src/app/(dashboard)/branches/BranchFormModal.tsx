"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createBranchAction, updateBranchAction, initialBranchActionState } from "./actions";
import type { Branch } from "@/services/branches";

export function BranchFormModal({
  open,
  onClose,
  branch,
}: {
  open: boolean;
  onClose: () => void;
  branch?: Branch;
}) {
  const action = branch ? updateBranchAction : createBranchAction;
  const [state, formAction, isPending] = useActionState(action, initialBranchActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(branch ? "Branch updated" : "Branch created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={branch ? "Edit branch" : "New branch"}>
      <form action={formAction} className="flex flex-col gap-4">
        {branch && <input type="hidden" name="branchId" value={branch.id} />}

        <FormField label="Branch name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={branch?.name} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Code" htmlFor="code" hint="Optional">
            <Input id="code" name="code" defaultValue={branch?.code ?? ""} />
          </FormField>
          <FormField label="Type" htmlFor="type">
            <Select id="type" name="type" defaultValue={branch?.type ?? "branch"}>
              <option value="head_office">Head Office</option>
              <option value="branch">Branch</option>
              <option value="warehouse">Warehouse</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={branch?.address?.city ?? ""} />
          </FormField>
          <FormField label="Country" htmlFor="country">
            <Input id="country" name="country" defaultValue={branch?.address?.country ?? "Zimbabwe"} />
          </FormField>
        </div>

        {branch && (
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" name="is_active" defaultChecked={branch.is_active} className="size-4 rounded border-border" />
            Active
          </label>
        )}

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {branch ? "Save changes" : "Create branch"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
