"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ConnectProviderModal } from "./ConnectProviderModal";
import type { IntegrationProvider } from "@/services/integrations";

export function ConnectButton({ provider }: { provider: IntegrationProvider }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Connect
      </Button>
      {open && <ConnectProviderModal provider={provider} onClose={() => setOpen(false)} />}
    </>
  );
}
