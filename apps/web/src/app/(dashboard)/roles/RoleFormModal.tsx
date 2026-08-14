"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createRoleAction, updateRoleAction, initialRoleActionState } from "./actions";
import type { Permission, RoleWithPermissions } from "@/services/roles";

export function RoleFormModal({
  open,
  onClose,
  role,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  role?: RoleWithPermissions;
  permissions: Permission[];
}) {
  const isEdit = !!role;
  const action = isEdit ? updateRoleAction : createRoleAction;
  const [state, formAction, isPending] = useActionState(action, initialRoleActionState);
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissionIds ?? []));
  const { push } = useToast();

  const permissionsLocked = isEdit && role.is_system;

  useEffect(() => {
    if (state.success) {
      push(isEdit ? "Role updated" : "Role created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${role.name}` : "New role"}>
      <form action={formAction} className="flex flex-col gap-4">
        {isEdit && (
          <>
            <input type="hidden" name="roleId" value={role.id} />
            <input type="hidden" name="isSystem" value={String(role.is_system)} />
          </>
        )}

        <FormField
          label={isEdit ? "Display label" : "Role name"}
          htmlFor="role-name"
          required={!isEdit}
          hint={isEdit ? `Shown instead of "${role.name}" throughout QuickBiz for this organization.` : undefined}
        >
          <Input
            id="role-name"
            name={isEdit ? "displayName" : "name"}
            required={!isEdit}
            placeholder={isEdit ? role.name : "e.g. Foreman, Instructor, Cashier"}
            defaultValue={isEdit ? role.displayName ?? "" : ""}
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Permissions</p>
          {permissionsLocked ? (
            <p className="text-xs text-text-tertiary">
              System role permission sets are fixed to keep grades consistent. Only the label above
              can be changed. Create a custom role for a hand-picked permission set.
            </p>
          ) : (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    name="permissionIds"
                    value={permission.id}
                    checked={selected.has(permission.id)}
                    onChange={() => toggle(permission.id)}
                    className="size-4 rounded border-border"
                  />
                  {permission.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? "Save changes" : "Create role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
