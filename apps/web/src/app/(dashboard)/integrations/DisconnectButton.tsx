"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { disconnectIntegrationAction, initialIntegrationActionState } from "./actions";

export function DisconnectButton({ providerKey, providerName }: { providerKey: string; providerName: string }) {
  const [state, formAction, isPending] = useActionState(disconnectIntegrationAction, initialIntegrationActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(`${providerName} disconnected`);
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="providerKey" value={providerKey} />
      <Button type="submit" size="sm" variant="secondary" loading={isPending}>
        Disconnect
      </Button>
    </form>
  );
}
