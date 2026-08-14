"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { toggleModuleAction, initialModuleActionState } from "./actions";

export function ModuleToggleButton({
  moduleKey,
  moduleName,
  enabled,
  canManage,
}: {
  moduleKey: string;
  moduleName: string;
  enabled: boolean;
  canManage: boolean;
}) {
  const [state, formAction, isPending] = useActionState(toggleModuleAction, initialModuleActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(`${moduleName} ${enabled ? "disabled" : "enabled"}`);
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="moduleKey" value={moduleKey} />
      <input type="hidden" name="nextStatus" value={enabled ? "disabled" : "enabled"} />
      <Button
        type="submit"
        size="sm"
        variant={enabled ? "secondary" : "primary"}
        loading={isPending}
        disabled={!canManage}
        title={canManage ? undefined : "Only the Owner can change module activation"}
      >
        {enabled ? "Disable" : "Enable"}
      </Button>
    </form>
  );
}
