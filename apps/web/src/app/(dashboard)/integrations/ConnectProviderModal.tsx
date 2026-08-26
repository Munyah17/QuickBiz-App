"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { connectIntegrationAction, initialIntegrationActionState } from "./actions";
import type { IntegrationProvider } from "@/services/integrations";

export function ConnectProviderModal({ provider, onClose }: { provider: IntegrationProvider; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(connectIntegrationAction, initialIntegrationActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(`${provider.name} connected`);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Connect ${provider.name}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="providerKey" value={provider.key} />
        <p className="text-sm text-text-tertiary">
          Enter the {provider.name} merchant details from your own {provider.name} account. QuickBiz stores these to
          record payments as coming through {provider.name} on your invoices and reports.
        </p>

        <FormField label="Label for this connection" htmlFor="accountLabel" required hint="e.g. your registered phone number or business name">
          <Input id="accountLabel" name="accountLabel" required />
        </FormField>

        {provider.credentialFields.map((field, i) => {
          const fieldId = `field-${i}`;
          return (
            <FormField key={field} label={field} htmlFor={fieldId}>
              <input type="hidden" name="fieldName" value={field} />
              <Input id={fieldId} name="fieldValue" type={field.toLowerCase().includes("key") ? "password" : "text"} />
            </FormField>
          );
        })}

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}
