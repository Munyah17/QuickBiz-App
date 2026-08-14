"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { inviteStaffAction, initialStaffActionState } from "./actions";

export function InviteStaffModal({
  open,
  onClose,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  roles: Array<{ key: string; name: string }>;
}) {
  const [state, formAction, isPending] = useActionState(inviteStaffAction, initialStaffActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Staff invitation sent");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title="Invite staff member">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Email" htmlFor="staff-email" required>
          <Input id="staff-email" name="email" type="email" required />
        </FormField>
        <FormField label="Role" htmlFor="staff-role">
          <Select id="staff-role" name="roleKey" defaultValue="tech_support">
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
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
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
