"use client";

import { useActionState, useEffect, useRef } from "react";
import { Select } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { assignRoleAction, initialUsersActionState } from "./actions";

export function RoleAssignSelect({
  orgMemberId,
  currentRoleId,
  roles,
}: {
  orgMemberId: string;
  currentRoleId: string | undefined;
  roles: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState(assignRoleAction, initialUsersActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Role updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="orgMemberId" value={orgMemberId} />
      <Select
        name="roleId"
        defaultValue={currentRoleId}
        className="h-8 text-sm"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
    </form>
  );
}
