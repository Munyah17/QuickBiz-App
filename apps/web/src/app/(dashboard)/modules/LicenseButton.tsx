"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { purchaseModuleLicense, cancelModuleLicense } from "./licenseActions";

export function LicenseButton({
  submissionId,
  licensed,
  canManage,
}: {
  submissionId: string;
  licensed: boolean;
  canManage: boolean;
}) {
  const { push } = useToast();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(licensed);

  function act(action: () => Promise<{ error?: string }>, successMsg: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        push(result.error, "error");
      } else {
        push(successMsg);
        setDone((v) => !v);
      }
    });
  }

  if (done) {
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={isPending}
        disabled={!canManage}
        onClick={() => act(() => cancelModuleLicense(submissionId), "License cancelled")}
      >
        Licensed
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      loading={isPending}
      disabled={!canManage}
      onClick={() => act(() => purchaseModuleLicense(submissionId), "License activated")}
    >
      Get module
    </Button>
  );
}
