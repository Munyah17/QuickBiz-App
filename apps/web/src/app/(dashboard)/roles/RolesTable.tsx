"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import { RoleFormModal } from "./RoleFormModal";
import { deleteRoleAction, initialRoleActionState } from "./actions";
import type { Permission, RoleWithPermissions } from "@/services/roles";

function DeleteRoleButton({ roleId, name }: { roleId: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteRoleAction, initialRoleActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    if (state.success) push(`${name} deleted`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="roleId" value={roleId} />
      <button
        type="submit"
        disabled={isPending}
        title="Delete role"
        className="text-text-tertiary hover:text-danger-600 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}

export function RolesTable({
  roles,
  permissions,
  canManage,
}: {
  roles: RoleWithPermissions[];
  permissions: Permission[];
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoleWithPermissions | undefined>(undefined);

  return (
    <Card className="overflow-x-auto">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{roles.length} roles</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            New Role
          </Button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-2.5">Role</th>
            {permissions.map((permission) => (
              <th key={permission.id} className="px-4 py-2.5 text-center">
                {permission.label}
              </th>
            ))}
            {canManage && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{role.displayName || role.name}</span>
                  {role.is_system ? (
                    <Badge tone="neutral">System</Badge>
                  ) : (
                    <Badge tone="info">Custom</Badge>
                  )}
                </div>
              </td>
              {permissions.map((permission) => (
                <td key={permission.id} className="px-4 py-2.5 text-center">
                  {role.permissionKeys.includes(permission.key) && (
                    <Check className="mx-auto size-4 text-success-600" />
                  )}
                </td>
              ))}
              {canManage && (
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditing(role);
                        setModalOpen(true);
                      }}
                      title="Edit role"
                      className="text-text-tertiary hover:text-primary-600"
                    >
                      <Pencil className="size-4" />
                    </button>
                    {!role.is_system && <DeleteRoleButton roleId={role.id} name={role.displayName || role.name} />}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {canManage && modalOpen && (
        <RoleFormModal
          key={editing?.id ?? "new"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          role={editing}
          permissions={permissions}
        />
      )}
    </Card>
  );
}
