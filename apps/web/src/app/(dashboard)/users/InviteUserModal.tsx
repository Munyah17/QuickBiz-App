"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { inviteMemberAction, initialUsersActionState } from "./actions";

export function InviteUserModal({
  open,
  onClose,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  roles: Array<{ id: string; key: string; name: string }>;
}) {
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialUsersActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Invitation sent");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title="Invite user">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Email" htmlFor="invite-email" required>
          <Input id="invite-email" name="email" type="email" required />
        </FormField>
        <FormField label="Role" htmlFor="invite-role">
          <Select id="invite-role" name="roleKey" defaultValue="staff">
            {roles.map((role) => (
              <option key={role.id} value={role.key}>
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
